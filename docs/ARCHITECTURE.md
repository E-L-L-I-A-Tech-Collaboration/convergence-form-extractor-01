# HRM / Hieromathematics / Binary Ledger Semiprime Factorization Architecture

## Objective

This application is specialized for semiprime prime-factor recovery:

`N = p × q`, where `p` and `q` are prime (not necessarily distinct).

The app exposes four factor-search engines:

1. Trial Division
2. Pollard's Rho
3. Lenstra ECM
4. GNFS through a native CADO-NFS backend

Every engine has a `Classical Control` profile. The three local engines and GNFS also expose the same experimental augmentation contract:

- **HRM is the dynamical computer.**
- **Hieromathematics is the semantic compiler/control language.**
- **The Binary Semantic Ledger is the deterministic local machine-state/execution record.**
- **Gemini is advisory only.**

No profile is allowed to bypass exact divisibility and local primality verification.

## HRM state

`src/augmentation.ts` implements the bounded, auditable factor-search HRM.

The authoritative state contains:

- **Field (Phi):** 12 bounded fast channels.
- **Geometry (G):** 12 slowly adapting ring-edge weights.
- **Topology (T):** fixed 12-node ring in this version.
- **Memory (M):** bounded temporal persistence.
- **Cognition (C):** bounded predictive state driven by search residuals.
- **Hierarchy (H):** three four-channel regional summaries.
- **Resources (B):** bounded work/resource pressure.

Every transition is constructed from one immutable pre-state. Named contributions and corrections are recorded separately, and the controller computes a reconstruction residual after every transition.

GNFS stage telemetry is projected into the same state contract. Polynomial selection, relation collection, filtering/matrix construction, linear algebra, and square-root activity are represented through optional phase-pressure telemetry channels.

## Hieromathematics

`src/hieromath.ts` compiles HRM state into one typed `factorization-search-directive`.

The semantic operators remain explicit:

- `COUPLE`
- `BIND`
- `INHIBIT`
- `PROJECT`

A directive is validated before it can be committed. Invalid directives are logged as `HIEROCODE_REJECT` and cannot control execution.

### Pollard Rho directive

- starting-point offset
- polynomial-constant offset
- restart cadence
- restart diversity

### ECM directive

- curve offset
- Stage-1 bound
- curve budget
- curve diversity

### Trial Division directive

- complete 6-wheel or 30-wheel profile, locked at run start

### GNFS directive

GNFS is deliberately integrated at documented CADO-NFS search-control points rather than by rewriting NFS arithmetic in TypeScript.

The directive controls bounded values mapped to CADO-NFS task parameters:

| Hieromath value | CADO-NFS parameter |
| --- | --- |
| `sizeOptimizationEffort` | `tasks.polyselect.sopteffort` |
| `rootOptimizationEffort` | `tasks.polyselect.ropteffort` |
| `polynomialsKept` | `tasks.polyselect.nrkeep` |
| `sieveQRange` | `tasks.sieve.qrange` |
| `filterKeep` | `tasks.filter.keep` |
| `targetDensity` | `tasks.filter.target_density` |
| `linalgBlock` | `tasks.linalg.m`, `tasks.linalg.n` |

The following remain entirely native/conventional inside CADO-NFS:

- polynomial arithmetic and Murphy-E scoring
- lattice sieving arithmetic
- relation mathematics
- filtering correctness
- sparse linear algebra
- algebraic square root
- GCD/factor extraction

This means an augmented GNFS run can change search effort and resource allocation while the correctness-critical GNFS mathematics remains the mature native implementation.

## Native GNFS boundary

GNFS runs server-side through `server/gnfs-runner.ts` because a browser Web Worker cannot execute the native CADO-NFS toolchain.

Configuration:

```text
CADO_NFS_PATH=/path/to/cado-nfs.py
GNFS_THREADS=2
GNFS_WORK_ROOT=/optional/work/root
```

The server invokes the executable with `spawn(..., { shell: false })`; the decimal target is passed as one argument and Hieromath overrides are passed as individual parameter arguments. No shell command is constructed from the target.

The HTTP endpoint `/api/gnfs-factor` streams newline-delimited JSON progress events to the browser.

### GNFS phase feedback

CADO output is inspected for stage transitions:

`polyselect -> sieve -> filter -> linalg -> sqrt -> final`

At phase transitions and periodic stage observations, the server:

1. constructs GNFS search telemetry,
2. advances HRM,
3. recomputes the Hieromath directive,
4. appends the HRM transition and Hierocode commit/reject to the Ledger,
5. streams the updated state to the UI.

The current version applies the GNFS directive at process launch. Later research could split CADO into separately orchestrated tasks and permit bounded inter-phase retuning, but that is intentionally not claimed here.

## Binary Semantic Ledger

`src/ledger.ts` provides canonical serialization and a deterministic 64-bit FNV-1a hash chain.

For augmented GNFS, important events include:

- `RUN_INIT`
- `RUN_CONFIG`
- `GNFS_BACKEND_CONFIG`
- `GNFS_POLYSELECT_DIRECTIVE`
- `GNFS_SIEVE_DIRECTIVE`
- `GNFS_FILTER_DIRECTIVE`
- `GNFS_LINALG_DIRECTIVE`
- `GNFS_PHASE_TRANSITION`
- `HRM_TRANSITION`
- `HIEROCODE_COMMIT`
- `HIEROCODE_REJECT`
- `FACTOR_FOUND`
- `GNFS_FACTOR_OUTPUT_VERIFIED`
- `SEMIPRIME_DIVISOR_ACCEPT`
- `RUN_FINAL`

The Ledger hash is a replay/audit checksum, not cryptographic authentication.

### GNFS reproducibility boundary

The local HRM/Hieromath state, parameter overrides, phase observations, and ledger construction are deterministic for a fixed input telemetry stream and replay seed.

CADO-NFS itself may make randomized internal choices that are not controlled by this app's replay seed. Therefore a real native GNFS run is **not claimed to be bit-for-bit replayable** merely because the local Ledger is deterministic. The Ledger explicitly records that external randomness boundary.

## Semiprime verification

A native backend factor is never trusted merely because CADO printed it. The server searches the backend output for decimal candidates and accepts a candidate only if:

`1 < d < N` and `N mod d = 0`.

Then:

`q = N / d`

Both `d` and `q` are independently screened for primality and the exact identity `d × q = N` is verified with `BigInt`.

Possible outcomes:

- `semiprime`
- `probable-semiprime`
- `prime-input`
- `not-semiprime`
- `unresolved`

## Gemini boundary

Gemini never receives the raw target integer. It receives only structural metadata, residue fingerprints, HRM state, and the current Hieromath directive.

For GNFS, advisory output is limited to bounded biases for:

- polynomial-selection effort
- root-optimization effort
- sieving effort
- filtering effort
- linear-algebra allocation

Those values are sanitized to `[-1, 1]` and then passed through the same local Hieromath bounds.

## Scientific controls

A GNFS timing comparison is meaningful only when the following are matched or explicitly accounted for:

- same semiprime
- same CADO-NFS version/build
- same hardware and thread count
- same work-directory state / fresh-run condition
- same stopping rule
- same pre-factor checks
- same success criterion
- exact factor-product verification
- enough repeated runs to characterize NFS run-to-run variance

The `Classical Control` GNFS profile passes no HRM/Hieromath CADO parameter overrides. The augmented profile does.

## Limitations

- CADO-NFS is an external dependency and is not bundled in this ZIP.
- CADO-NFS upstream states it is optimized for inputs above 85 digits and does not support inputs below 60 digits.
- GNFS internal randomness is outside the local replay-seed contract.
- The current HRM directive is applied at GNFS process launch, not continuously retuned inside a running CADO process.
- The FNV ledger checksum is not a security-grade authentication mechanism.
- JavaScript primality screening above 64 bits is probable-prime screening, not a formal primality certificate.
- No complexity-class or general speedup claim is implied.
