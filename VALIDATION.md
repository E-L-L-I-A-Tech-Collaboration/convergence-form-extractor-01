# Validation Report — GNFS Integration

## Date

2026-09-03

## Scope

This validation covers the new GNFS integration plus regression checks for the existing semiprime engines.

## Static / syntax verification

All 13 TypeScript / TSX files present at the validation point transpiled successfully with the installed TypeScript compiler's syntax pipeline.

The sandbox did not contain the project's npm dependencies, so a full Vite/React production build was not used as the primary validation path.

## Regression test — local engines

The existing core suite was emitted with the TypeScript compiler and executed with Node.

Passed:

- Trial Division / Classical
- Pollard Rho / Classical
- ECM / Classical
- Trial Division / HRM
- Pollard Rho / HRM
- ECM / HRM
- `101^2` semiprime square
- three-prime composite rejection
- prime-input classification
- honest ECM exhaustion
- same-seed augmented Rho ledger replay

Observed augmented Rho ledger head in this validation environment:

`3d944d8e60907442`

## GNFS adapter integration test

A deterministic mock native executable was used to exercise the server-side GNFS adapter without pretending that the sandbox contained CADO-NFS.

Mock stage stream:

1. polynomial selection
2. root optimization
3. relation sieving
4. filtering
5. sparse linear algebra
6. square root
7. factor output

Target:

`10403 = 101 × 103`

Result:

- status: `semiprime`
- factors: `101`, `103`
- exact product verification: PASS
- HRM reconstruction residual max: `0`
- GNFS phase transitions observed: `5`
- Binary Semantic Ledger events: `29`
- ledger head in the standalone mock validation: `0c3f662aa752100b`

Required GNFS events were observed:

- `GNFS_POLYSELECT_DIRECTIVE`
- `GNFS_SIEVE_DIRECTIVE`
- `GNFS_FILTER_DIRECTIVE`
- `GNFS_LINALG_DIRECTIVE`
- `GNFS_PHASE_TRANSITION`
- `HRM_TRANSITION`
- `HIEROCODE_COMMIT`
- `FACTOR_FOUND`
- `GNFS_FACTOR_OUTPUT_VERIFIED`

## What was not validated here

A real CADO-NFS factorization was not run in this sandbox because CADO-NFS is not installed as part of the application and is intentionally not bundled.

Therefore this report validates:

- the native-process adapter,
- bounded parameter generation,
- phase parsing,
- HRM feedback,
- Hieromath validation,
- ledger instrumentation,
- local factor acceptance and semiprime verification,

but it does **not** claim a measured HRM-vs-classical GNFS speedup.

## Reproducibility note

The local HRM/Hieromath/Ledger path is deterministic for identical telemetry and replay seed. A real CADO-NFS execution can contain native randomized choices outside this app's seed contract. Real GNFS benchmarking must therefore record the CADO build and run conditions and use repeated trials.
