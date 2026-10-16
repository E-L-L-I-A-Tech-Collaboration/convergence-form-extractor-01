import { AugmentationController } from './augmentation';
import { BinarySemanticLedger } from './ledger';
import { absBig, assessPrimality, bitLength, gcd, isProbablePrime, isqrt, mod, primesUpTo, seedFromString, XorShift64 } from './math';
import type { FactorizationRequest, FactorizationResult, HRMState, HieroObject, SearchTelemetry } from './types';

export interface ProgressSink {
  (message: string, fraction: number, hrm?: HRMState, directive?: HieroObject): void;
}

interface Ops {
  gcdCalls: number;
  modularSteps: number;
  curves: number;
  trialCandidates: number;
  restarts: number;
}

interface RunContext {
  request: FactorizationRequest;
  ops: Ops;
  ledger?: BinarySemanticLedger;
  controller?: AugmentationController;
  progress?: ProgressSink;
  cancelled?: () => boolean;
}

function checkCancelled(ctx: RunContext) {
  if (ctx.cancelled?.()) throw new Error('Cancelled');
}

function emit(ctx: RunContext, message: string, fraction: number) {
  ctx.progress?.(message, Math.max(0, Math.min(1, fraction)), ctx.controller?.state, ctx.controller?.directive);
}

function observe(ctx: RunContext, telemetry: SearchTelemetry) {
  if (!ctx.controller || !ctx.ledger) return;
  const report = ctx.controller.observe(telemetry);
  ctx.ledger.append('HRM_TRANSITION', {
    step: report.state.step,
    telemetry,
    contributions: report.contributions,
    correctionsL1: report.correctionsL1,
    reconstructionResidualMax: report.residualMax,
    state: report.state
  });
  if (ctx.controller.directive.state === 'valid') {
    ctx.ledger.append('HIEROCODE_COMMIT', ctx.controller.directive);
  } else {
    ctx.ledger.append('HIEROCODE_REJECT', ctx.controller.directive);
  }
}

function classicalDirectiveDefaults(bits: number) {
  return {
    rho: { startOffset: 0, constantOffset: 0, restartCadence: Math.min(120000, Math.max(8000, 8000 + bits * 120)), diversity: 4 },
    ecm: { curveOffset: 0, stage1Bound: Math.min(12000, Math.max(300, 250 + bits * 14)), curveBudget: Math.min(160, Math.max(8, Math.round(8 + bits / 6))), diversity: 4 },
    trial: { wheel: 30 as 6 | 30 }
  };
}

function wheelData(wheel: 6 | 30): { start: bigint; steps: bigint[] } {
  if (wheel === 6) return { start: 5n, steps: [2n, 4n] };
  return { start: 7n, steps: [4n, 2n, 4n, 2n, 4n, 6n, 2n, 6n] };
}

function trialFindFactor(n: bigint, ctx: RunContext, fixedWheel?: 6 | 30): bigint | null {
  for (const p of [2n, 3n, 5n]) if (n % p === 0n) return p;
  const bits = bitLength(n);
  const defaults = classicalDirectiveDefaults(bits);
  const wheel = fixedWheel ?? ctx.controller?.directive.value.trial.wheel ?? defaults.trial.wheel;
  const { start, steps } = wheelData(wheel);
  const root = isqrt(n);
  const configured = BigInt(ctx.request.limits?.trialLimit ?? Number.MAX_SAFE_INTEGER);
  const limit = configured < root ? configured : root;
  let d = start;
  let i = 0;
  let lastProgress = 0;
  while (d <= limit) {
    checkCancelled(ctx);
    ctx.ops.trialCandidates++;
    if (n % d === 0n) return d;
    d += steps[i++ % steps.length];
    if ((ctx.ops.trialCandidates & 4095) === 0) {
      const frac = Number(d < root ? d : root) / Math.max(1, Number(root < 1000000000n ? root : 1000000000n));
      lastProgress = Math.min(0.99, Math.max(lastProgress, frac));
      observe(ctx, {
        step: ctx.ops.trialCandidates,
        normalizedWork: Math.min(1, ctx.ops.trialCandidates / 1000000),
        stagnation: Math.min(1, ctx.ops.trialCandidates / 500000),
        gcdSignal: 0,
        progressSignal: lastProgress,
        failurePressure: 0,
        restartPressure: 0,
        curvePressure: 0,
        residueSignal: Number(d % 997n) / 997
      });
      emit(ctx, `Trial division testing candidate ${d.toString()}`, lastProgress);
    }
  }
  return null;
}

function rhoFindFactor(n: bigint, ctx: RunContext): bigint | null {
  if (n % 2n === 0n) return 2n;
  const bits = bitLength(n);
  const defaults = classicalDirectiveDefaults(bits).rho;
  const maxIterations = ctx.request.limits?.maxIterations ?? Math.max(100000, bits * 40000);
  const rng = new XorShift64(seedFromString(`${ctx.request.replaySeed}:rho:${n.toString().slice(-32)}`));
  let total = 0;
  let stagnation = 0;

  for (let restart = 0; total < maxIterations; restart++) {
    checkCancelled(ctx);
    ctx.ops.restarts++;
    const directive = ctx.controller?.directive.value.rho ?? defaults;
    const diversity = BigInt(Math.max(2, directive.diversity));
    let x = mod(rng.between(2n, n - 1n) + BigInt(directive.startOffset) + BigInt(restart) * diversity, n);
    if (x < 2n) x += 2n;
    let y = x;
    let c = mod(rng.between(1n, n - 1n) + BigInt(directive.constantOffset) + BigInt(restart + 1) * diversity, n);
    if (c === 0n) c = 1n;
    const cadence = Math.min(maxIterations - total, directive.restartCadence);
    ctx.ledger?.append('RHO_RESTART', { restart, prngState: rng.state.toString(), x0: x.toString(), c: c.toString(), cadence, diversity: Number(diversity) });

    for (let local = 0; local < cadence && total < maxIterations; local++, total++) {
      x = (x * x + c) % n;
      y = (y * y + c) % n;
      y = (y * y + c) % n;
      ctx.ops.modularSteps += 3;
      const delta = absBig(x - y);
      const d = gcd(delta, n);
      ctx.ops.gcdCalls++;
      if (d > 1n && d < n) {
        ctx.ledger?.append('FACTOR_FOUND', { method: 'rho', factor: d.toString(), iteration: total, prngState: rng.state.toString() });
        return d;
      }
      if (d === n) {
        stagnation += 1;
        break;
      }
      if ((local & 255) === 0) {
        const collisionSignal = delta === 0n ? 1 : Math.min(1, Number(delta % 4096n) / 4096);
        observe(ctx, {
          step: total,
          normalizedWork: Math.min(1, total / maxIterations),
          stagnation: Math.min(1, (stagnation + local / Math.max(1, cadence)) / 4),
          gcdSignal: 0,
          progressSignal: 1 - collisionSignal,
          failurePressure: Math.min(1, restart / 16),
          restartPressure: Math.min(1, local / Math.max(1, cadence)),
          curvePressure: 0,
          residueSignal: Number(x % 997n) / 997
        });
        emit(ctx, `Pollard Rho iteration ${total.toLocaleString()} · restart ${restart + 1}`, total / maxIterations);
      }
    }
  }
  ctx.ledger?.append('ALGORITHM_EXHAUSTED', { method: 'rho', maxIterations });
  return null;
}

class FactorFound extends Error {
  factor: bigint;
  constructor(factor: bigint) {
    super('factor found');
    this.factor = factor;
  }
}
class CurveFailure extends Error {}

type Point = { x: bigint; y: bigint } | null;

function inverseOrFactor(a: bigint, n: bigint, ctx: RunContext): bigint {
  const aa = mod(a, n);
  const g = gcd(aa, n);
  ctx.ops.gcdCalls++;
  if (g > 1n && g < n) throw new FactorFound(g);
  if (g === n || aa === 0n) throw new CurveFailure();
  let [t, newT] = [0n, 1n];
  let [r, newR] = [n, aa];
  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  if (r !== 1n) throw new CurveFailure();
  return mod(t, n);
}

function pointAdd(P: Point, Q: Point, a: bigint, n: bigint, ctx: RunContext): Point {
  if (!P) return Q;
  if (!Q) return P;
  if (P.x === Q.x && mod(P.y + Q.y, n) === 0n) return null;
  let slope: bigint;
  if (P.x === Q.x && P.y === Q.y) {
    const den = 2n * P.y;
    const inv = inverseOrFactor(den, n, ctx);
    slope = mod((3n * P.x * P.x + a) * inv, n);
  } else {
    const den = Q.x - P.x;
    const inv = inverseOrFactor(den, n, ctx);
    slope = mod((Q.y - P.y) * inv, n);
  }
  const x3 = mod(slope * slope - P.x - Q.x, n);
  const y3 = mod(slope * (P.x - x3) - P.y, n);
  ctx.ops.modularSteps += 6;
  return { x: x3, y: y3 };
}

function scalarMul(k: bigint, P: Point, a: bigint, n: bigint, ctx: RunContext): Point {
  let R: Point = null;
  let Q = P;
  let s = k;
  while (s > 0n) {
    if (s & 1n) R = pointAdd(R, Q, a, n, ctx);
    s >>= 1n;
    if (s > 0n && Q) Q = pointAdd(Q, Q, a, n, ctx);
  }
  return R;
}

function ecmFindFactor(n: bigint, ctx: RunContext): bigint | null {
  if (n % 2n === 0n) return 2n;
  if (n % 3n === 0n) return 3n;
  const bits = bitLength(n);
  const defaults = classicalDirectiveDefaults(bits).ecm;
  const rng = new XorShift64(seedFromString(`${ctx.request.replaySeed}:ecm:${n.toString().slice(-32)}`));
  const maxCurvesHard = ctx.request.limits?.maxCurves ?? 160;
  let curve = 0;

  while (curve < maxCurvesHard) {
    checkCancelled(ctx);
    const directive = ctx.controller?.directive.value.ecm ?? defaults;
    const curveBudget = Math.min(maxCurvesHard, directive.curveBudget);
    if (curve >= curveBudget) break;
    const B1 = directive.stage1Bound;
    const diversity = BigInt(Math.max(2, directive.diversity));
    ctx.ops.curves++;
    try {
      let x = mod(rng.between(2n, n - 1n) + BigInt(directive.curveOffset) + BigInt(curve + 1) * diversity, n);
      let y = mod(rng.between(2n, n - 1n) + BigInt(curve + 3) * diversity, n);
      let a = mod(rng.between(1n, n - 1n) + BigInt(directive.curveOffset), n);
      if (x === 0n) x = 2n;
      if (y === 0n) y = 3n;
      if (a === 0n) a = 1n;
      const b = mod(y * y - x * x * x - a * x, n);
      const discriminant = mod(4n * a * a * a + 27n * b * b, n);
      const dg = gcd(discriminant, n);
      ctx.ops.gcdCalls++;
      if (dg > 1n && dg < n) return dg;
      if (dg === n || discriminant === 0n) throw new CurveFailure();
      ctx.ledger?.append('ECM_CURVE', { curve, prngState: rng.state.toString(), x: x.toString(), y: y.toString(), a: a.toString(), b: b.toString(), B1, diversity: Number(diversity) });

      let P: Point = { x, y };
      const primes = primesUpTo(B1);
      for (let pi = 0; pi < primes.length; pi++) {
        const p = primes[pi];
        let power = p;
        while (power * p <= B1) power *= p;
        P = scalarMul(BigInt(power), P, a, n, ctx);
        if ((pi & 31) === 0) {
          observe(ctx, {
            step: curve * Math.max(1, primes.length) + pi,
            normalizedWork: Math.min(1, (curve + pi / Math.max(1, primes.length)) / Math.max(1, curveBudget)),
            stagnation: Math.min(1, curve / Math.max(1, curveBudget)),
            gcdSignal: 0,
            progressSignal: pi / Math.max(1, primes.length),
            failurePressure: Math.min(1, curve / Math.max(1, curveBudget)),
            restartPressure: 0,
            curvePressure: Math.min(1, curve / Math.max(1, curveBudget)),
            residueSignal: P ? Number(P.x % 997n) / 997 : 0
          });
          emit(ctx, `ECM curve ${curve + 1}/${curveBudget} · Stage 1 prime ${pi + 1}/${primes.length}`, (curve + pi / Math.max(1, primes.length)) / Math.max(1, curveBudget));
        }
      }
    } catch (e) {
      if (e instanceof FactorFound) {
        ctx.ledger?.append('FACTOR_FOUND', { method: 'ecm', factor: e.factor.toString(), curve, prngState: rng.state.toString() });
        return e.factor;
      }
      if (!(e instanceof CurveFailure)) throw e;
      ctx.ledger?.append('ECM_CURVE_REJECT', { curve, reason: 'non-invertible/degenerate denominator without proper factor' });
    }
    curve++;
  }
  ctx.ledger?.append('ALGORITHM_EXHAUSTED', { method: 'ecm', curves: curve });
  return null;
}

function statusFromChecks(a: ReturnType<typeof assessPrimality>, b: ReturnType<typeof assessPrimality>) {
  if (a === 'composite' || b === 'composite') return 'not-semiprime' as const;
  if (a === 'prime-deterministic-64' && b === 'prime-deterministic-64') return 'semiprime' as const;
  return 'probable-semiprime' as const;
}

function finishFromDivisor(target: bigint, d: bigint, ctx: RunContext, started: number, source: string): FactorizationResult {
  if (d <= 1n || d >= target || target % d !== 0n) {
    throw new Error('Internal factor candidate failed exact divisibility validation.');
  }
  let p = d;
  let q = target / d;
  if (p > q) [p, q] = [q, p];
  const pPrime = assessPrimality(p);
  const qPrime = assessPrimality(q);
  const status = statusFromChecks(pPrime, qPrime);
  const productVerified = p * q === target;
  const primeFactors = status === 'semiprime' || status === 'probable-semiprime' ? [p.toString(), q.toString()] : [];

  ctx.ledger?.append('SEMIPRIME_DIVISOR_ACCEPT', {
    source,
    divisor: d.toString(),
    p: p.toString(),
    q: q.toString(),
    pPrimality: pPrime,
    qPrimality: qPrime,
    productVerified,
    status
  });
  ctx.ledger?.append('RUN_FINAL', {
    objective: 'semiprime-prime-factorization',
    status,
    primeFactors,
    productVerified,
    operations: ctx.ops,
    reconstructionResidualMax: ctx.controller?.residualMax ?? 0
  });
  emit(ctx, status === 'not-semiprime' ? 'A proper divisor was found, but the two-factor split is not prime × prime.' : 'Semiprime factor pair verified.', 1);

  return {
    input: target.toString(),
    method: ctx.request.method,
    profile: ctx.request.profile,
    objective: 'semiprime-prime-factorization',
    status,
    primeFactors,
    factorChecks: [
      { value: p.toString(), primality: pPrime },
      { value: q.toString(), primality: qPrime }
    ],
    discoveredDivisor: d.toString(),
    complementaryFactor: (target / d).toString(),
    productVerified,
    complete: status === 'semiprime' || status === 'probable-semiprime',
    durationMs: performance.now() - started,
    operations: ctx.ops,
    ledger: ctx.ledger?.snapshot(),
    finalHRM: ctx.controller?.state,
    directive: ctx.controller?.directive,
    reconstructionResidualMax: ctx.controller?.residualMax,
    advisoryRationale: ctx.request.advisory?.rationale
  };
}

export function factorize(request: FactorizationRequest, progress?: ProgressSink, cancelled?: () => boolean): FactorizationResult {
  if (request.method === 'gnfs') throw new Error('GNFS runs through the server-side native CADO-NFS adapter, not the browser worker.');
  const started = performance.now();
  const target = BigInt(request.target.trim());
  if (target < 4n) throw new Error('Enter a composite semiprime candidate N >= 4.');
  const bits = bitLength(target);
  const digits = target.toString().length;
  const augmented = request.profile !== 'classical';
  const ledger = augmented ? new BinarySemanticLedger(request.replaySeed) : undefined;
  const controller = augmented ? new AugmentationController(request.method, bits, digits, request.replaySeed, request.advisory) : undefined;
  const ops: Ops = { gcdCalls: 0, modularSteps: 0, curves: 0, trialCandidates: 0, restarts: 0 };
  const ctx: RunContext = { request, ops, ledger, controller, progress, cancelled };

  ledger?.append('RUN_CONFIG', {
    objective: 'semiprime-prime-factorization',
    method: request.method,
    profile: request.profile,
    bitLength: bits,
    digitLength: digits,
    limits: request.limits ?? {},
    advisory: request.profile === 'gemini' ? request.advisory ?? null : null
  });
  if (controller) {
    if (controller.directive.state === 'valid') ledger?.append('HIEROCODE_COMMIT', controller.directive);
    else ledger?.append('HIEROCODE_REJECT', controller.directive);
  }

  // Fast structural classification is identical across all profiles.
  // A prime input cannot be a semiprime under the p*q definition used by this app.
  const targetPrime = assessPrimality(target);
  if (targetPrime !== 'composite') {
    ledger?.append('PRIME_INPUT_REJECT', { primality: targetPrime });
    ledger?.append('RUN_FINAL', { objective: 'semiprime-prime-factorization', status: 'prime-input', productVerified: false, operations: ops });
    emit(ctx, 'Input passes the primality screen; it is not a semiprime candidate.', 1);
    return {
      input: target.toString(), method: request.method, profile: request.profile,
      objective: 'semiprime-prime-factorization', status: 'prime-input', primeFactors: [],
      factorChecks: [{ value: target.toString(), primality: targetPrime }], productVerified: false, complete: false,
      durationMs: performance.now() - started, operations: ops, ledger: ledger?.snapshot(), finalHRM: controller?.state,
      directive: controller?.directive, reconstructionResidualMax: controller?.residualMax, advisoryRationale: request.advisory?.rationale
    };
  }

  // Perfect-square semiprimes p^2 are recognized exactly and verified for primality.
  const root = isqrt(target);
  if (root * root === target) {
    const rootPrime = assessPrimality(root);
    ledger?.append('PERFECT_SQUARE_CHECK', { root: root.toString(), rootPrimality: rootPrime });
    if (rootPrime !== 'composite') return finishFromDivisor(target, root, ctx, started, 'perfect-square-precheck');
    ledger?.append('RUN_FINAL', { objective: 'semiprime-prime-factorization', status: 'not-semiprime', reason: 'composite-perfect-square-root', operations: ops });
    emit(ctx, 'Perfect square detected, but its root is composite; input is not prime × prime.', 1);
    return {
      input: target.toString(), method: request.method, profile: request.profile,
      objective: 'semiprime-prime-factorization', status: 'not-semiprime', primeFactors: [],
      factorChecks: [{ value: root.toString(), primality: rootPrime }], discoveredDivisor: root.toString(), complementaryFactor: root.toString(),
      productVerified: true, complete: false, durationMs: performance.now() - started, operations: ops, ledger: ledger?.snapshot(),
      finalHRM: controller?.state, directive: controller?.directive, reconstructionResidualMax: controller?.residualMax,
      advisoryRationale: request.advisory?.rationale
    };
  }

  // Shared small-prime prepass. It finds only one divisor because a semiprime needs exactly one split.
  for (const p of primesUpTo(97)) {
    const bp = BigInt(p);
    if (target % bp === 0n) {
      ledger?.append('SMALL_PRIME_DIVISOR', { divisor: p });
      return finishFromDivisor(target, bp, ctx, started, 'shared-small-prime-prepass');
    }
  }

  const fixedTrialWheel = request.method === 'trial' ? (controller?.directive.value.trial.wheel ?? 30) : undefined;
  if (fixedTrialWheel) ledger?.append('TRIAL_PROFILE_LOCK', { wheel: fixedTrialWheel });

  let d: bigint | null = null;
  if (request.method === 'trial') d = trialFindFactor(target, ctx, fixedTrialWheel);
  if (request.method === 'rho') d = rhoFindFactor(target, ctx);
  if (request.method === 'ecm') d = ecmFindFactor(target, ctx);

  if (d && d > 1n && d < target && target % d === 0n) {
    if (request.method === 'trial') ledger?.append('FACTOR_FOUND', { method: 'trial', factor: d.toString() });
    return finishFromDivisor(target, d, ctx, started, request.method);
  }

  ledger?.append('UNRESOLVED_SEMIPRIME_CANDIDATE', { value: target.toString(), method: request.method });
  ledger?.append('RUN_FINAL', {
    objective: 'semiprime-prime-factorization', status: 'unresolved', unresolved: target.toString(), productVerified: false,
    operations: ops, reconstructionResidualMax: controller?.residualMax ?? 0
  });
  emit(ctx, 'Search budget exhausted before a nontrivial divisor was found.', 1);
  return {
    input: target.toString(), method: request.method, profile: request.profile,
    objective: 'semiprime-prime-factorization', status: 'unresolved', primeFactors: [], factorChecks: [], unresolved: target.toString(),
    productVerified: false, complete: false, durationMs: performance.now() - started, operations: ops, ledger: ledger?.snapshot(),
    finalHRM: controller?.state, directive: controller?.directive, reconstructionResidualMax: controller?.residualMax,
    advisoryRationale: request.advisory?.rationale
  };
}
