import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AugmentationController } from '../src/augmentation';
import { BinarySemanticLedger } from '../src/ledger';
import { assessPrimality, bitLength, isqrt, primesUpTo } from '../src/math';
import type {
  FactorizationRequest,
  FactorizationResult,
  GnfsStreamMessage,
  HRMState,
  HieroObject,
  SearchTelemetry,
  SemiprimeStatus
} from '../src/types';

export interface GnfsRunnerOptions {
  cadoPath?: string;
  workRoot?: string;
  keepWorkdir?: boolean;
}

export interface GnfsProgressSink {
  (message: GnfsStreamMessage): void;
}

type GnfsPhase = 'startup' | 'polyselect' | 'sieve' | 'filter' | 'linalg' | 'sqrt' | 'final';

interface RunnerState {
  outputLines: number;
  phaseTransitions: number;
  phase: GnfsPhase;
  factor: bigint | null;
}

function phaseInfo(line: string): { phase: GnfsPhase; fraction: number } | null {
  const s = line.toLowerCase();
  if (/(square root|sqrt|characters)/.test(s)) return { phase: 'sqrt', fraction: 0.95 };
  if (/(linalg|linear algebra|block wiedemann|bwc)/.test(s)) return { phase: 'linalg', fraction: 0.84 };
  if (/(filter|merge|purge|singleton|dup1|dup2)/.test(s)) return { phase: 'filter', fraction: 0.72 };
  if (/(siev|relation|special-q|las\b)/.test(s)) return { phase: 'sieve', fraction: 0.30 };
  if (/(polyselect|polynomial|rootsieve|murphy|ropt|sopt)/.test(s)) return { phase: 'polyselect', fraction: 0.08 };
  return null;
}

function telemetryFor(phase: GnfsPhase, outputLines: number, transition: boolean): SearchTelemetry {
  const phaseOrdinal: Record<GnfsPhase, number> = {
    startup: 0.02,
    polyselect: 0.14,
    sieve: 0.48,
    filter: 0.74,
    linalg: 0.88,
    sqrt: 0.97,
    final: 1
  };
  const progress = phaseOrdinal[phase];
  const localPulse = (outputLines % 101) / 101;
  return {
    step: outputLines,
    normalizedWork: progress,
    stagnation: Math.max(0, Math.min(1, 0.2 + 0.4 * (1 - localPulse))),
    gcdSignal: 0,
    progressSignal: progress,
    failurePressure: 0,
    restartPressure: transition ? 0.15 : 0,
    curvePressure: 0,
    residueSignal: localPulse,
    polyPressure: phase === 'polyselect' ? 0.8 : 0,
    relationPressure: phase === 'sieve' ? 0.9 : 0,
    matrixPressure: phase === 'filter' || phase === 'linalg' ? 0.85 : 0,
    sqrtPressure: phase === 'sqrt' ? 0.9 : 0
  };
}

function statusFromChecks(a: ReturnType<typeof assessPrimality>, b: ReturnType<typeof assessPrimality>): SemiprimeStatus {
  if (a === 'composite' || b === 'composite') return 'not-semiprime';
  if (a === 'prime-deterministic-64' && b === 'prime-deterministic-64') return 'semiprime';
  return 'probable-semiprime';
}

function extractDivisorFromText(text: string, target: bigint): bigint | null {
  const targetDigits = target.toString().length;
  const tokens = text.match(/\b\d{2,}\b/g) ?? [];
  for (const token of tokens) {
    if (token.length > targetDigits) continue;
    let candidate: bigint;
    try { candidate = BigInt(token); } catch { continue; }
    if (candidate > 1n && candidate < target && target % candidate === 0n) return candidate;
  }
  return null;
}

async function scanWorkdirForFactor(dir: string, target: bigint): Promise<bigint | null> {
  const queue = [dir];
  let inspected = 0;
  while (queue.length && inspected < 120) {
    const current = queue.shift()!;
    let entries;
    try { entries = await readdir(current, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(full);
        continue;
      }
      if (++inspected > 120) break;
      if (!/\.(log|txt|out|factors?|data)$/i.test(entry.name) && !/factor/i.test(entry.name)) continue;
      try {
        const buf = await readFile(full);
        if (buf.byteLength > 2_000_000) continue;
        const d = extractDivisorFromText(buf.toString('utf8'), target);
        if (d) return d;
      } catch {
        // Audit helper only; unreadable files do not invalidate the run.
      }
    }
  }
  return null;
}

function gnfsOverrides(directive?: HieroObject): string[] {
  if (!directive || directive.state !== 'valid') return [];
  const g = directive.value.gnfs;
  return [
    `tasks.polyselect.sopteffort=${g.sizeOptimizationEffort}`,
    `tasks.polyselect.ropteffort=${g.rootOptimizationEffort}`,
    `tasks.polyselect.nrkeep=${g.polynomialsKept}`,
    `tasks.sieve.qrange=${g.sieveQRange}`,
    `tasks.filter.keep=${g.filterKeep}`,
    `tasks.filter.target_density=${g.targetDensity}`,
    `tasks.linalg.m=${g.linalgBlock}`,
    `tasks.linalg.n=${g.linalgBlock}`
  ];
}

function buildFactorResult(
  request: FactorizationRequest,
  target: bigint,
  divisor: bigint,
  started: number,
  ledger: BinarySemanticLedger | undefined,
  controller: AugmentationController | undefined,
  backend: FactorizationResult['gnfsBackend'],
  operations: FactorizationResult['operations']
): FactorizationResult {
  let p = divisor;
  let q = target / divisor;
  if (p > q) [p, q] = [q, p];
  const pPrime = assessPrimality(p);
  const qPrime = assessPrimality(q);
  const status = statusFromChecks(pPrime, qPrime);
  const productVerified = p * q === target;
  const primeFactors = status === 'semiprime' || status === 'probable-semiprime' ? [p.toString(), q.toString()] : [];

  ledger?.append('SEMIPRIME_DIVISOR_ACCEPT', {
    source: 'gnfs-cado-nfs', divisor: divisor.toString(), p: p.toString(), q: q.toString(),
    pPrimality: pPrime, qPrimality: qPrime, productVerified, status
  });
  ledger?.append('RUN_FINAL', {
    objective: 'semiprime-prime-factorization', status, primeFactors, productVerified,
    operations, reconstructionResidualMax: controller?.residualMax ?? 0, backend
  });

  return {
    input: target.toString(), method: 'gnfs', profile: request.profile,
    objective: 'semiprime-prime-factorization', status, primeFactors,
    factorChecks: [{ value: p.toString(), primality: pPrime }, { value: q.toString(), primality: qPrime }],
    discoveredDivisor: divisor.toString(), complementaryFactor: (target / divisor).toString(),
    productVerified, complete: status === 'semiprime' || status === 'probable-semiprime',
    durationMs: performance.now() - started, operations, ledger: ledger?.snapshot(), finalHRM: controller?.state,
    directive: controller?.directive, reconstructionResidualMax: controller?.residualMax,
    advisoryRationale: request.advisory?.rationale, gnfsBackend: backend
  };
}

function buildSimpleResult(
  request: FactorizationRequest,
  target: bigint,
  started: number,
  status: SemiprimeStatus,
  ledger: BinarySemanticLedger | undefined,
  controller: AugmentationController | undefined,
  operations: FactorizationResult['operations'],
  backend?: FactorizationResult['gnfsBackend'],
  factorChecks: FactorizationResult['factorChecks'] = [],
  discoveredDivisor?: bigint
): FactorizationResult {
  const productVerified = status === 'not-semiprime' && Boolean(discoveredDivisor);
  ledger?.append('RUN_FINAL', { objective: 'semiprime-prime-factorization', status, productVerified, operations, backend });
  return {
    input: target.toString(), method: 'gnfs', profile: request.profile, objective: 'semiprime-prime-factorization', status,
    primeFactors: [], factorChecks, discoveredDivisor: discoveredDivisor?.toString(),
    complementaryFactor: discoveredDivisor ? (target / discoveredDivisor).toString() : undefined,
    unresolved: status === 'unresolved' ? target.toString() : undefined,
    productVerified, complete: false, durationMs: performance.now() - started, operations, ledger: ledger?.snapshot(),
    finalHRM: controller?.state, directive: controller?.directive, reconstructionResidualMax: controller?.residualMax,
    advisoryRationale: request.advisory?.rationale, gnfsBackend: backend
  };
}

export async function runGnfsFactorization(
  request: FactorizationRequest,
  sink: GnfsProgressSink,
  signal?: AbortSignal,
  options: GnfsRunnerOptions = {}
): Promise<FactorizationResult> {
  const started = performance.now();
  const target = BigInt(request.target.trim());
  if (target < 4n) throw new Error('Enter a composite semiprime candidate N >= 4.');
  if (request.method !== 'gnfs') throw new Error('GNFS runner received a non-GNFS method.');
  const bits = bitLength(target);
  const digits = target.toString().length;
  const augmented = request.profile !== 'classical';
  const ledger = augmented ? new BinarySemanticLedger(request.replaySeed) : undefined;
  const controller = augmented ? new AugmentationController('gnfs', bits, digits, request.replaySeed, request.advisory) : undefined;
  const operations: FactorizationResult['operations'] = {
    gcdCalls: 0, modularSteps: 0, curves: 0, trialCandidates: 0, restarts: 0,
    gnfsOutputLines: 0, gnfsPhaseTransitions: 0
  };

  ledger?.append('RUN_CONFIG', {
    objective: 'semiprime-prime-factorization', method: 'gnfs', profile: request.profile,
    bitLength: bits, digitLength: digits, limits: request.limits ?? {},
    advisory: request.profile === 'gemini' ? request.advisory ?? null : null,
    externalEngine: 'cado-nfs'
  });
  if (controller) ledger?.append(controller.directive.state === 'valid' ? 'HIEROCODE_COMMIT' : 'HIEROCODE_REJECT', controller.directive);

  const primeAssessment = assessPrimality(target);
  if (primeAssessment !== 'composite') {
    ledger?.append('PRIME_INPUT_REJECT', { primality: primeAssessment });
    return buildSimpleResult(request, target, started, 'prime-input', ledger, controller, operations, undefined, [{ value: target.toString(), primality: primeAssessment }]);
  }

  const root = isqrt(target);
  if (root * root === target) {
    const rPrime = assessPrimality(root);
    ledger?.append('PERFECT_SQUARE_CHECK', { root: root.toString(), rootPrimality: rPrime });
    if (rPrime !== 'composite') return buildFactorResult(request, target, root, started, ledger, controller, undefined, operations);
    return buildSimpleResult(request, target, started, 'not-semiprime', ledger, controller, operations, undefined, [{ value: root.toString(), primality: rPrime }], root);
  }

  for (const p of primesUpTo(97)) {
    const bp = BigInt(p);
    if (target % bp === 0n) {
      ledger?.append('SMALL_PRIME_DIVISOR', { divisor: p });
      return buildFactorResult(request, target, bp, started, ledger, controller, undefined, operations);
    }
  }

  const cadoPath = options.cadoPath ?? process.env.CADO_NFS_PATH ?? 'cado-nfs.py';
  const workRoot = options.workRoot ?? process.env.GNFS_WORK_ROOT ?? tmpdir();
  const workdir = await mkdtemp(path.join(workRoot, 'hrm-gnfs-'));
  const requestedThreads = request.limits?.gnfsThreads ?? Number(process.env.GNFS_THREADS || '2');
  const threads = Number.isFinite(requestedThreads) ? Math.max(1, Math.min(256, Math.round(requestedThreads))) : 2;
  const threadArgs = ['-t', String(threads)];
  const overrideArgs = augmented ? gnfsOverrides(controller?.directive) : [];
  const args = [target.toString(), ...threadArgs, `tasks.workdir=${workdir}`, ...overrideArgs];

  ledger?.append('GNFS_BACKEND_CONFIG', {
    engine: 'cado-nfs', executable: cadoPath, args: args.map((x, i) => i === 0 ? `[N:${digits} digits]` : x),
    workdir, overrides: overrideArgs, cadoInternalRandomnessControlled: false
  });
  if (augmented) {
    ledger?.append('GNFS_POLYSELECT_DIRECTIVE', controller!.directive.value.gnfs);
    ledger?.append('GNFS_SIEVE_DIRECTIVE', { qrange: controller!.directive.value.gnfs.sieveQRange });
    ledger?.append('GNFS_FILTER_DIRECTIVE', { keep: controller!.directive.value.gnfs.filterKeep, targetDensity: controller!.directive.value.gnfs.targetDensity });
    ledger?.append('GNFS_LINALG_DIRECTIVE', { block: controller!.directive.value.gnfs.linalgBlock });
  }

  sink({ type: 'progress', message: `Launching native GNFS backend (${digits} digits)…`, fraction: 0.02, hrm: controller?.state, directive: controller?.directive });

  const runState: RunnerState = { outputLines: 0, phaseTransitions: 0, phase: 'startup', factor: null };
  let exitCode: number | null = null;
  let exitSignal: NodeJS.Signals | null = null;
  let spawnError: Error | null = null;
  let trailingStdout = '';
  let trailingStderr = '';

  const observe = (phase: GnfsPhase, transition: boolean) => {
    if (!controller || !ledger) return;
    const telemetry = telemetryFor(phase, runState.outputLines, transition);
    const report = controller.observe(telemetry);
    ledger.append('HRM_TRANSITION', {
      step: report.state.step, phase, telemetry, contributions: report.contributions,
      correctionsL1: report.correctionsL1, reconstructionResidualMax: report.residualMax, state: report.state
    });
    ledger.append(controller.directive.state === 'valid' ? 'HIEROCODE_COMMIT' : 'HIEROCODE_REJECT', controller.directive);
  };

  const handleLine = (raw: string, stream: 'stdout' | 'stderr') => {
    const line = raw.trim();
    if (!line) return;
    runState.outputLines++;
    operations.gnfsOutputLines = runState.outputLines;
    const detected = phaseInfo(line);
    let fraction = 0.03;
    if (detected) {
      fraction = detected.fraction;
      if (detected.phase !== runState.phase) {
        runState.phase = detected.phase;
        runState.phaseTransitions++;
        operations.gnfsPhaseTransitions = runState.phaseTransitions;
        ledger?.append('GNFS_PHASE_TRANSITION', { phase: detected.phase, outputLine: runState.outputLines });
        observe(detected.phase, true);
      } else if (runState.outputLines % 64 === 0) {
        observe(detected.phase, false);
      }
    }
    if (!runState.factor) {
      const d = extractDivisorFromText(line, target);
      if (d) {
        runState.factor = d;
        ledger?.append('FACTOR_FOUND', { method: 'gnfs', factor: d.toString(), phase: runState.phase, outputLine: runState.outputLines, stream });
      }
    }
    if (detected || runState.outputLines % 40 === 0) {
      sink({
        type: 'progress',
        message: `GNFS ${runState.phase}: ${line.slice(0, 180)}`,
        fraction,
        hrm: controller?.state,
        directive: controller?.directive
      });
    }
  };

  await new Promise<void>((resolve) => {
    const child = spawn(cadoPath, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    const onAbort = () => {
      ledger?.append('GNFS_CANCEL_REQUEST', { phase: runState.phase, outputLines: runState.outputLines });
      child.kill('SIGTERM');
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    const consume = (chunk: Buffer, which: 'stdout' | 'stderr') => {
      let text = (which === 'stdout' ? trailingStdout : trailingStderr) + chunk.toString('utf8');
      const lines = text.split(/\r?\n/);
      const tail = lines.pop() ?? '';
      if (which === 'stdout') trailingStdout = tail; else trailingStderr = tail;
      for (const line of lines) handleLine(line, which);
    };
    child.stdout.on('data', (c: Buffer) => consume(c, 'stdout'));
    child.stderr.on('data', (c: Buffer) => consume(c, 'stderr'));
    child.on('error', err => { spawnError = err; });
    child.on('close', (code, sig) => {
      if (trailingStdout) handleLine(trailingStdout, 'stdout');
      if (trailingStderr) handleLine(trailingStderr, 'stderr');
      exitCode = code;
      exitSignal = sig;
      signal?.removeEventListener('abort', onAbort);
      resolve();
    });
  });

  if (!runState.factor) runState.factor = await scanWorkdirForFactor(workdir, target);
  if (runState.factor) ledger?.append('GNFS_FACTOR_OUTPUT_VERIFIED', { factor: runState.factor.toString(), dividesTarget: true });

  const backend: FactorizationResult['gnfsBackend'] = {
    engine: 'cado-nfs',
    available: !spawnError,
    workdir,
    exitCode,
    signal: exitSignal,
    commandArgs: args.map((x, i) => i === 0 ? `[N:${digits} digits]` : x),
    phaseTransitions: runState.phaseTransitions,
    outputLines: runState.outputLines,
    note: spawnError
      ? `CADO-NFS could not be launched: ${(spawnError as Error).message}`
      : digits < 60
        ? 'CADO-NFS upstream does not support inputs below 60 digits; this run is for experimental comparison only.'
        : 'CADO-NFS internal randomized choices are external to the local replay seed; the ledger records controller state, parameters, phases, and output-derived events.'
  };

  if (signal?.aborted) throw new Error('Cancelled');
  if (spawnError) {
    ledger?.append('GNFS_BACKEND_UNAVAILABLE', { message: (spawnError as Error).message, executable: cadoPath });
    sink({ type: 'progress', message: backend.note!, fraction: 1, hrm: controller?.state, directive: controller?.directive });
    return buildSimpleResult(request, target, started, 'unresolved', ledger, controller, operations, backend);
  }

  if (runState.factor && runState.factor > 1n && runState.factor < target && target % runState.factor === 0n) {
    observe('final', true);
    sink({ type: 'progress', message: 'GNFS returned a nontrivial divisor; verifying the semiprime pair locally.', fraction: 0.99, hrm: controller?.state, directive: controller?.directive });
    return buildFactorResult(request, target, runState.factor, started, ledger, controller, backend, operations);
  }

  ledger?.append('GNFS_EXHAUSTED_OR_UNPARSED', { exitCode, signal: exitSignal, outputLines: runState.outputLines, phase: runState.phase });
  sink({ type: 'progress', message: 'GNFS ended without a locally verified nontrivial divisor.', fraction: 1, hrm: controller?.state, directive: controller?.directive });
  return buildSimpleResult(request, target, started, 'unresolved', ledger, controller, operations, backend);
}
