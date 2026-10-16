import assert from 'node:assert/strict';
import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runGnfsFactorization } from '../server/gnfs-runner';

const root = await mkdtemp(path.join(tmpdir(), 'hrm-gnfs-test-'));
const fake = path.join(root, 'fake-cado.sh');
await writeFile(fake, `#!/bin/sh
printf '%s\n' \
  'polyselect: Murphy E candidate search' \
  'rootsieve: polynomial optimization' \
  'sieve: collecting relations special-q 1009' \
  'filter: merge relation matrix' \
  'linalg: block Wiedemann' \
  'sqrt: square root stage' \
  'factor 101' \
  'factor 103'
exit 0
`);
await chmod(fake, 0o755);

const result = await runGnfsFactorization(
  { target: '10403', method: 'gnfs', profile: 'hrm', replaySeed: 'gnfs-test-seed', limits: { gnfsThreads: 2 } },
  () => undefined,
  undefined,
  { cadoPath: fake, workRoot: root }
);

assert.equal(result.status, 'semiprime');
assert.deepEqual(result.primeFactors, ['101', '103']);
assert.equal(result.productVerified, true);
assert.ok(result.ledger);
assert.ok((result.reconstructionResidualMax ?? 1) < 1e-12);
const types = new Set(result.ledger!.events.map(e => e.type));
for (const type of [
  'GNFS_POLYSELECT_DIRECTIVE', 'GNFS_SIEVE_DIRECTIVE', 'GNFS_FILTER_DIRECTIVE',
  'GNFS_LINALG_DIRECTIVE', 'GNFS_PHASE_TRANSITION', 'HRM_TRANSITION',
  'HIEROCODE_COMMIT', 'FACTOR_FOUND', 'GNFS_FACTOR_OUTPUT_VERIFIED'
]) assert.ok(types.has(type), `missing ${type}`);

console.log('GNFS native-adapter integration test passed.');
console.log(`Ledger head: ${result.ledger!.head}`);
