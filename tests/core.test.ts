import assert from 'node:assert/strict';
import { factorize } from '../src/factorization';

function request(method: 'trial' | 'rho' | 'ecm', profile: 'classical' | 'hrm' = 'classical', seed = 'semiprime-test-seed') {
  return {
    target: '10403', // 101 * 103; above the shared <=97 prepass
    method,
    profile,
    replaySeed: seed,
    limits: { maxIterations: 500000, maxCurves: 80 }
  } as const;
}

function verify(method: 'trial' | 'rho' | 'ecm', profile: 'classical' | 'hrm') {
  const result = factorize(request(method, profile));
  assert.equal(result.status, 'semiprime', `${method}/${profile}: semiprime not verified`);
  assert.equal(result.productVerified, true, `${method}/${profile}: product verification failed`);
  assert.equal(result.complete, true, `${method}/${profile}: incomplete`);
  assert.deepEqual(result.primeFactors, ['101', '103'], `${method}/${profile}: wrong prime pair`);
  assert.ok(result.factorChecks.every(x => x.primality === 'prime-deterministic-64'));
  return result;
}

console.log('Testing semiprime classical controls...');
verify('trial', 'classical');
verify('rho', 'classical');
verify('ecm', 'classical');

console.log('Testing semiprime HRM/Hieromath/Ledger paths...');
verify('trial', 'hrm');
const rho1 = verify('rho', 'hrm');
const rho2 = verify('rho', 'hrm');
verify('ecm', 'hrm');
assert.ok(rho1.ledger && rho2.ledger, 'augmented run must emit a ledger');
assert.equal(rho1.ledger!.head, rho2.ledger!.head, 'same seed must reproduce the same ledger head');
assert.ok((rho1.reconstructionResidualMax ?? 1) < 1e-12, 'HRM transition reconstruction residual too large');

console.log('Testing p^2 semiprime...');
const square = factorize({ target: '10201', method: 'rho', profile: 'hrm', replaySeed: 'square' }); // 101^2
assert.equal(square.status, 'semiprime');
assert.deepEqual(square.primeFactors, ['101', '101']);
assert.equal(square.productVerified, true);

console.log('Testing non-semiprime classification...');
const nonSemi = factorize({ target: '1113121', method: 'trial', profile: 'classical', replaySeed: 'not-semi' }); // 101*103*107
assert.equal(nonSemi.status, 'not-semiprime');
assert.equal(nonSemi.complete, false);
assert.equal(nonSemi.productVerified, true);
assert.equal(nonSemi.primeFactors.length, 0);

console.log('Testing prime-input classification...');
const primeInput = factorize({ target: '104729', method: 'rho', profile: 'classical', replaySeed: 'prime-input' });
assert.equal(primeInput.status, 'prime-input');
assert.equal(primeInput.complete, false);

console.log('Testing honest search exhaustion...');
const unresolved = factorize({ target: '10403', method: 'ecm', profile: 'classical', replaySeed: 'exhaust', limits: { maxCurves: 0 } });
assert.equal(unresolved.status, 'unresolved');
assert.equal(unresolved.complete, false);
assert.equal(unresolved.unresolved, '10403');
assert.equal(unresolved.productVerified, false);

console.log('All semiprime core tests passed.');
console.log(`Deterministic augmented Rho ledger head: ${rho1.ledger!.head}`);
