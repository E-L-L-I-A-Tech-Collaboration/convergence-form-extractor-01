export type Method = 'trial' | 'rho' | 'ecm' | 'gnfs';
export type Profile = 'classical' | 'hrm' | 'gemini';
export type SemiprimeStatus = 'semiprime' | 'probable-semiprime' | 'prime-input' | 'not-semiprime' | 'unresolved';
export type PrimalityKind = 'prime-deterministic-64' | 'probable-prime' | 'composite';

export interface SearchTelemetry {
  step: number;
  normalizedWork: number;
  stagnation: number;
  gcdSignal: number;
  progressSignal: number;
  failurePressure: number;
  restartPressure: number;
  curvePressure: number;
  residueSignal: number;
  polyPressure?: number;
  relationPressure?: number;
  matrixPressure?: number;
  sqrtPressure?: number;
}

export interface HRMState {
  step: number;
  field: { phi: number[] };
  geometry: { ringWeights: number[]; stress: number };
  topology: { nodes: number; edges: [number, number][]; version: number };
  memory: { values: number[] };
  cognition: { values: number[]; residual: number };
  hierarchy: { regions: number[] };
  resources: { pressure: number; workUsed: number; budget: number };
}

export interface HRMTransitionReport {
  state: HRMState;
  residualMax: number;
  correctionsL1: number;
  contributions: Record<string, number>;
}

export interface AdvisoryGuidance {
  rhoStartBias?: number;
  rhoConstantBias?: number;
  restartBias?: number;
  diversityBias?: number;
  ecmCurveBias?: number;
  ecmBoundBias?: number;
  ecmBudgetBias?: number;
  wheelBias?: number;
  gnfsPolyBias?: number;
  gnfsRootBias?: number;
  gnfsSieveBias?: number;
  gnfsFilterBias?: number;
  gnfsLinalgBias?: number;
  rationale?: string;
}

export interface SearchDirectiveValue {
  rho: {
    startOffset: number;
    constantOffset: number;
    restartCadence: number;
    diversity: number;
  };
  ecm: {
    curveOffset: number;
    stage1Bound: number;
    curveBudget: number;
    diversity: number;
  };
  trial: {
    wheel: 6 | 30;
  };
  gnfs: {
    sizeOptimizationEffort: number;
    rootOptimizationEffort: number;
    polynomialsKept: number;
    sieveQRange: number;
    filterKeep: number;
    targetDensity: number;
    linalgBlock: 64 | 128;
  };
}

export interface HieroObject {
  identity: 'factorization-search-directive';
  value: SearchDirectiveValue;
  category: 'search_control';
  context: {
    method: Method;
    bitLength: number;
    digitLength: number;
    replaySeed: string;
  };
  behavior: Array<'COUPLE' | 'BIND' | 'INHIBIT' | 'PROJECT'>;
  state: 'valid' | 'invalid';
  representation: 'hierocode-json-v1';
  validationErrors: string[];
}

export interface LedgerEvent {
  index: number;
  type: string;
  timestampLogical: number;
  payload: unknown;
  prevHash: string;
  hash: string;
}

export interface LedgerSnapshot {
  replaySeed: string;
  head: string;
  events: LedgerEvent[];
}

export interface PrimeFactorCheck {
  value: string;
  primality: PrimalityKind;
}

export interface GnfsBackendInfo {
  engine: 'cado-nfs';
  available: boolean;
  workdir?: string;
  exitCode?: number | null;
  signal?: string | null;
  commandArgs?: string[];
  phaseTransitions?: number;
  outputLines?: number;
  note?: string;
}

export interface FactorizationResult {
  input: string;
  method: Method;
  profile: Profile;
  objective: 'semiprime-prime-factorization';
  status: SemiprimeStatus;
  primeFactors: string[];
  factorChecks: PrimeFactorCheck[];
  discoveredDivisor?: string;
  complementaryFactor?: string;
  unresolved?: string;
  productVerified: boolean;
  complete: boolean;
  durationMs: number;
  operations: {
    gcdCalls: number;
    modularSteps: number;
    curves: number;
    trialCandidates: number;
    restarts: number;
    gnfsOutputLines?: number;
    gnfsPhaseTransitions?: number;
  };
  ledger?: LedgerSnapshot;
  finalHRM?: HRMState;
  directive?: HieroObject;
  reconstructionResidualMax?: number;
  advisoryRationale?: string;
  gnfsBackend?: GnfsBackendInfo;
}

export interface FactorizationRequest {
  target: string;
  method: Method;
  profile: Profile;
  replaySeed: string;
  advisory?: AdvisoryGuidance;
  limits?: {
    maxIterations?: number;
    maxCurves?: number;
    trialLimit?: number;
    gnfsThreads?: number;
  };
}

export type WorkerIn =
  | { type: 'factor'; request: FactorizationRequest }
  | { type: 'cancel' };

export type WorkerOut =
  | { type: 'progress'; message: string; fraction: number; hrm?: HRMState; directive?: HieroObject }
  | { type: 'result'; result: FactorizationResult }
  | { type: 'error'; error: string };

export type GnfsStreamMessage = WorkerOut;
