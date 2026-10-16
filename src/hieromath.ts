import { clamp, clampInt } from './math';
import type { AdvisoryGuidance, HRMState, HieroObject, Method, SearchDirectiveValue } from './types';

function avg(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
}

function sanitizeAdvisory(a?: AdvisoryGuidance): Required<Omit<AdvisoryGuidance, 'rationale'>> & { rationale: string } {
  return {
    rhoStartBias: clamp(Number(a?.rhoStartBias ?? 0), -1, 1),
    rhoConstantBias: clamp(Number(a?.rhoConstantBias ?? 0), -1, 1),
    restartBias: clamp(Number(a?.restartBias ?? 0), -1, 1),
    diversityBias: clamp(Number(a?.diversityBias ?? 0), -1, 1),
    ecmCurveBias: clamp(Number(a?.ecmCurveBias ?? 0), -1, 1),
    ecmBoundBias: clamp(Number(a?.ecmBoundBias ?? 0), -1, 1),
    ecmBudgetBias: clamp(Number(a?.ecmBudgetBias ?? 0), -1, 1),
    wheelBias: clamp(Number(a?.wheelBias ?? 0), -1, 1),
    gnfsPolyBias: clamp(Number(a?.gnfsPolyBias ?? 0), -1, 1),
    gnfsRootBias: clamp(Number(a?.gnfsRootBias ?? 0), -1, 1),
    gnfsSieveBias: clamp(Number(a?.gnfsSieveBias ?? 0), -1, 1),
    gnfsFilterBias: clamp(Number(a?.gnfsFilterBias ?? 0), -1, 1),
    gnfsLinalgBias: clamp(Number(a?.gnfsLinalgBias ?? 0), -1, 1),
    rationale: String(a?.rationale ?? '').slice(0, 500)
  };
}

export function compileDirective(
  state: HRMState,
  method: Method,
  bitLength: number,
  digitLength: number,
  replaySeed: string,
  advisory?: AdvisoryGuidance
): HieroObject {
  const adv = sanitizeAdvisory(advisory);
  const phiA = avg(state.field.phi.slice(0, 4));
  const phiB = avg(state.field.phi.slice(4, 8));
  const phiC = avg(state.field.phi.slice(8, 12));
  const mem = avg(state.memory.values);
  const cog = avg(state.cognition.values);
  const hier = avg(state.hierarchy.regions);
  const geom = avg(state.geometry.ringWeights) - 1;

  // Hieromathematical operators are explicit transformations of typed state:
  // COUPLE combines named channels; BIND maps them to bounded parameters;
  // INHIBIT reduces aggressive search under resource pressure; PROJECT selects discrete profiles.
  const coupledRho = clamp(0.45 * phiA + 0.25 * mem + 0.2 * cog + 0.1 * adv.diversityBias, -1, 1);
  const coupledEcm = clamp(0.4 * phiB + 0.25 * hier + 0.2 * geom + 0.15 * adv.ecmCurveBias, -1, 1);
  const coupledGnfs = clamp(0.30 * phiA + 0.25 * phiB + 0.15 * phiC + 0.15 * mem + 0.15 * hier, -1, 1);
  const inhibit = clamp(1 - 0.65 * state.resources.pressure, 0.2, 1);
  const scale = Math.max(1, Math.min(10, bitLength / 32));
  const gnfsScale = clamp((digitLength - 55) / 100, 0, 1);

  const linalgScore = clamp(coupledGnfs + adv.gnfsLinalgBias - 0.45 * state.resources.pressure, -1, 1);

  const value: SearchDirectiveValue = {
    rho: {
      startOffset: clampInt((coupledRho + adv.rhoStartBias) * 4096, -8192, 8192),
      constantOffset: clampInt((phiC + adv.rhoConstantBias) * 2048, -4096, 4096),
      restartCadence: clampInt((8000 + scale * 2500) * (1 - 0.35 * adv.restartBias) / inhibit, 2000, 120000),
      diversity: clampInt(4 + 5 * (coupledRho + 1) / 2 + 3 * adv.diversityBias, 2, 12)
    },
    ecm: {
      curveOffset: clampInt((coupledEcm + adv.ecmCurveBias) * 2048, -4096, 4096),
      stage1Bound: clampInt((250 + bitLength * 14) * (1 + 0.6 * adv.ecmBoundBias) * inhibit, 100, 12000),
      curveBudget: clampInt((8 + bitLength / 6) * (1 + 0.65 * adv.ecmBudgetBias) / inhibit, 4, 160),
      diversity: clampInt(3 + 6 * (coupledEcm + 1) / 2 + 2 * adv.diversityBias, 2, 12)
    },
    trial: {
      wheel: (phiA + hier + adv.wheelBias >= 0 ? 30 : 6) as 6 | 30
    },
    gnfs: {
      // These map to documented CADO-NFS task parameters. They guide search effort,
      // not polynomial arithmetic, lattice arithmetic, sparse linear algebra, or sqrt correctness.
      sizeOptimizationEffort: Number(clamp(0.10 + 0.45 * gnfsScale + 0.25 * (coupledGnfs + 1) / 2 + 0.35 * adv.gnfsPolyBias, 0, 1.5).toFixed(3)),
      rootOptimizationEffort: Number(clamp(0.20 + 0.65 * gnfsScale + 0.35 * (phiB + 1) / 2 + 0.40 * adv.gnfsRootBias, 0.05, 2.0).toFixed(3)),
      polynomialsKept: clampInt(16 + 18 * gnfsScale + 8 * (coupledGnfs + 1) / 2 + 8 * adv.gnfsPolyBias, 10, 64),
      sieveQRange: clampInt((1800 + digitLength * 32) * (1 + 0.55 * adv.gnfsSieveBias) / inhibit, 1000, 20000),
      filterKeep: clampInt(130 + digitLength * 0.8 + 35 * adv.gnfsFilterBias, 80, 320),
      targetDensity: clampInt(130 + digitLength * 0.5 + 45 * adv.gnfsFilterBias + 20 * coupledGnfs, 80, 260),
      linalgBlock: (linalgScore > 0.35 && digitLength >= 95 ? 128 : 64) as 64 | 128
    }
  };

  const errors: string[] = [];
  if (!Number.isInteger(value.rho.restartCadence) || value.rho.restartCadence < 2000 || value.rho.restartCadence > 120000) errors.push('rho.restartCadence out of bounds');
  if (value.rho.diversity < 2 || value.rho.diversity > 12) errors.push('rho.diversity out of bounds');
  if (value.ecm.stage1Bound < 100 || value.ecm.stage1Bound > 12000) errors.push('ecm.stage1Bound out of bounds');
  if (value.ecm.curveBudget < 4 || value.ecm.curveBudget > 160) errors.push('ecm.curveBudget out of bounds');
  if (value.trial.wheel !== 6 && value.trial.wheel !== 30) errors.push('trial.wheel invalid');
  if (value.gnfs.sizeOptimizationEffort < 0 || value.gnfs.sizeOptimizationEffort > 1.5) errors.push('gnfs.sizeOptimizationEffort out of bounds');
  if (value.gnfs.rootOptimizationEffort < 0.05 || value.gnfs.rootOptimizationEffort > 2) errors.push('gnfs.rootOptimizationEffort out of bounds');
  if (value.gnfs.polynomialsKept < 10 || value.gnfs.polynomialsKept > 64) errors.push('gnfs.polynomialsKept out of bounds');
  if (value.gnfs.sieveQRange < 1000 || value.gnfs.sieveQRange > 20000) errors.push('gnfs.sieveQRange out of bounds');
  if (value.gnfs.filterKeep < 80 || value.gnfs.filterKeep > 320) errors.push('gnfs.filterKeep out of bounds');
  if (value.gnfs.targetDensity < 80 || value.gnfs.targetDensity > 260) errors.push('gnfs.targetDensity out of bounds');
  if (value.gnfs.linalgBlock !== 64 && value.gnfs.linalgBlock !== 128) errors.push('gnfs.linalgBlock invalid');

  return {
    identity: 'factorization-search-directive',
    value,
    category: 'search_control',
    context: { method, bitLength, digitLength, replaySeed },
    behavior: ['COUPLE', 'BIND', 'INHIBIT', 'PROJECT'],
    state: errors.length ? 'invalid' : 'valid',
    representation: 'hierocode-json-v1',
    validationErrors: errors
  };
}
