import { clamp, seedFromString, XorShift64 } from './math';
import { compileDirective } from './hieromath';
import type { AdvisoryGuidance, HRMState, HRMTransitionReport, HieroObject, Method, SearchTelemetry } from './types';

const N = 12;
const REGIONS = 3;
const REGION_SIZE = 4;
const DT = 0.08;

const zeros = () => Array.from({ length: N }, () => 0);
const clampVec = (v: number[], lo = -1, hi = 1) => v.map(x => clamp(x, lo, hi));
const l1 = (v: number[]) => v.reduce((a, b) => a + Math.abs(b), 0);
const maxAbs = (v: number[]) => v.reduce((m, x) => Math.max(m, Math.abs(x)), 0);

export function createInitialHRMState(replaySeed: string): HRMState {
  const rng = new XorShift64(seedFromString(`hrm:${replaySeed}`));
  const phi = Array.from({ length: N }, () => Number(rng.nextU64() % 2001n) / 1000 - 1);
  const memory = phi.map(x => 0.15 * x);
  const cognition = phi.map(x => -0.1 * x);
  const edges: [number, number][] = Array.from({ length: N }, (_, i) => [i, (i + 1) % N]);
  return {
    step: 0,
    field: { phi },
    geometry: { ringWeights: Array.from({ length: N }, () => 1), stress: 0 },
    topology: { nodes: N, edges, version: 1 },
    memory: { values: memory },
    cognition: { values: cognition, residual: 0 },
    hierarchy: { regions: [0, 0, 0] },
    resources: { pressure: 0, workUsed: 0, budget: 1 }
  };
}

function regionOf(i: number): number {
  return Math.floor(i / REGION_SIZE);
}

function telemetryVector(t: SearchTelemetry): number[] {
  const gnfsPressure = Math.max(
    t.polyPressure ?? 0,
    t.relationPressure ?? 0,
    t.matrixPressure ?? 0,
    t.sqrtPressure ?? 0
  );
  const phasePressure = Math.max(t.curvePressure, gnfsPressure);
  const base = [
    t.normalizedWork,
    t.stagnation,
    t.gcdSignal,
    t.progressSignal,
    t.failurePressure,
    t.restartPressure,
    phasePressure,
    t.residueSignal,
    1 - t.stagnation,
    t.progressSignal - t.failurePressure,
    t.gcdSignal - t.restartPressure,
    t.residueSignal - phasePressure
  ];
  return base.map(x => clamp(x * 2 - 1, -1, 1));
}

export function transitionHRM(pre: HRMState, telemetry: SearchTelemetry): HRMTransitionReport {
  // One immutable pre-state snapshot feeds every proposal below.
  const p = pre.field.phi.slice();
  const m = pre.memory.values.slice();
  const c = pre.cognition.values.slice();
  const w = pre.geometry.ringWeights.slice();
  const h = pre.hierarchy.regions.slice();
  const u = telemetryVector(telemetry);

  const passive = p.map(x => DT * -0.12 * x);
  const diffusion = p.map((x, i) => {
    const left = (i + N - 1) % N;
    const right = (i + 1) % N;
    const lap = w[left] * (p[left] - x) + w[i] * (p[right] - x);
    return DT * 0.18 * lap;
  });
  const reaction = p.map(x => DT * 0.22 * x * (1 - x * x));
  const nonlocal = p.map((x, i) => DT * 0.10 * (h[regionOf(i)] - x));
  const memoryCoupling = m.map(x => DT * 0.12 * x);
  const cognitionCoupling = c.map(x => DT * 0.12 * x);
  const external = u.map(x => DT * 0.20 * x);
  const interaction = m.map((x, i) => DT * 0.06 * x * c[i]);

  const rawPhi = p.map((x, i) => x + passive[i] + diffusion[i] + reaction[i] + nonlocal[i] + memoryCoupling[i] + cognitionCoupling[i] + external[i] + interaction[i]);
  const nextPhi = clampVec(rawPhi);
  const correctionPhi = nextPhi.map((x, i) => x - rawPhi[i]);

  const memoryProposal = m.map((x, i) => DT * (-0.08 * x + 0.16 * p[i] + 0.08 * c[i]));
  const rawMemory = m.map((x, i) => x + memoryProposal[i]);
  const nextMemory = clampVec(rawMemory);
  const correctionMemory = nextMemory.map((x, i) => x - rawMemory[i]);

  const cognitiveResidual = clamp(telemetry.progressSignal - telemetry.stagnation - 0.4 * telemetry.failurePressure, -1, 1);
  const cognitionProposal = c.map((x, i) => DT * (-0.10 * x + 0.12 * p[i] + 0.10 * m[i] + 0.12 * u[i] + 0.06 * cognitiveResidual));
  const rawCognition = c.map((x, i) => x + cognitionProposal[i]);
  const nextCognition = clampVec(rawCognition);
  const correctionCognition = nextCognition.map((x, i) => x - rawCognition[i]);

  const nextHierarchy = Array.from({ length: REGIONS }, (_, r) => {
    const region = p.slice(r * REGION_SIZE, (r + 1) * REGION_SIZE);
    const mean = region.reduce((a, b) => a + b, 0) / REGION_SIZE;
    return clamp(h[r] + DT * 0.18 * (mean - h[r]), -1, 1);
  });

  const edgeStress = p.reduce((sum, x, i) => sum + Math.abs(x - p[(i + 1) % N]), 0) / N;
  const nextWeights = w.map((x, i) => clamp(x + DT * 0.025 * (Math.abs(p[i] - p[(i + 1) % N]) - edgeStress), 0.7, 1.3));
  const resourcePressure = clamp(0.6 * telemetry.normalizedWork + 0.25 * telemetry.failurePressure + 0.15 * telemetry.stagnation, 0, 1);

  const state: HRMState = {
    step: pre.step + 1,
    field: { phi: nextPhi },
    geometry: { ringWeights: nextWeights, stress: edgeStress },
    topology: { ...pre.topology, edges: pre.topology.edges.map(e => [...e] as [number, number]) },
    memory: { values: nextMemory },
    cognition: { values: nextCognition, residual: cognitiveResidual },
    hierarchy: { regions: nextHierarchy },
    resources: {
      pressure: resourcePressure,
      workUsed: clamp(pre.resources.workUsed + telemetry.normalizedWork * 0.02, 0, 1),
      budget: pre.resources.budget
    }
  };

  // Reconstruction residual for the fast additive blocks after recorded corrections.
  const phiReconstructed = p.map((x, i) => x + passive[i] + diffusion[i] + reaction[i] + nonlocal[i] + memoryCoupling[i] + cognitionCoupling[i] + external[i] + interaction[i] + correctionPhi[i]);
  const memReconstructed = m.map((x, i) => x + memoryProposal[i] + correctionMemory[i]);
  const cogReconstructed = c.map((x, i) => x + cognitionProposal[i] + correctionCognition[i]);
  const residuals = [
    ...nextPhi.map((x, i) => x - phiReconstructed[i]),
    ...nextMemory.map((x, i) => x - memReconstructed[i]),
    ...nextCognition.map((x, i) => x - cogReconstructed[i])
  ];

  return {
    state,
    residualMax: maxAbs(residuals),
    correctionsL1: l1(correctionPhi) + l1(correctionMemory) + l1(correctionCognition),
    contributions: {
      passive: l1(passive),
      diffusion: l1(diffusion),
      reaction: l1(reaction),
      nonlocal: l1(nonlocal),
      memoryCoupling: l1(memoryCoupling),
      cognitionCoupling: l1(cognitionCoupling),
      external: l1(external),
      memoryCognitionInteraction: l1(interaction),
      memoryProposal: l1(memoryProposal),
      cognitionProposal: l1(cognitionProposal),
      correction: l1(correctionPhi) + l1(correctionMemory) + l1(correctionCognition)
    }
  };
}

export class AugmentationController {
  state: HRMState;
  directive: HieroObject;
  residualMax = 0;
  private readonly method: Method;
  private readonly bits: number;
  private readonly digits: number;
  private readonly seed: string;
  private readonly advisory?: AdvisoryGuidance;

  constructor(method: Method, bits: number, digits: number, replaySeed: string, advisory?: AdvisoryGuidance) {
    this.method = method;
    this.bits = bits;
    this.digits = digits;
    this.seed = replaySeed;
    this.advisory = advisory;
    this.state = createInitialHRMState(replaySeed);
    this.directive = compileDirective(this.state, method, bits, digits, replaySeed, advisory);
  }

  observe(t: SearchTelemetry): HRMTransitionReport {
    const report = transitionHRM(this.state, t);
    this.state = report.state;
    this.residualMax = Math.max(this.residualMax, report.residualMax);
    this.directive = compileDirective(this.state, this.method, this.bits, this.digits, this.seed, this.advisory);
    return report;
  }
}
