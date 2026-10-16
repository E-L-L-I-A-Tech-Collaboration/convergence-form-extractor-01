export const absBig = (x: bigint) => (x < 0n ? -x : x);

export function gcd(a: bigint, b: bigint): bigint {
  a = absBig(a);
  b = absBig(b);
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

export function mod(a: bigint, n: bigint): bigint {
  const r = a % n;
  return r < 0n ? r + n : r;
}

export function modPow(base: bigint, exp: bigint, n: bigint): bigint {
  if (n === 1n) return 0n;
  let b = mod(base, n);
  let e = exp;
  let out = 1n;
  while (e > 0n) {
    if (e & 1n) out = (out * b) % n;
    b = (b * b) % n;
    e >>= 1n;
  }
  return out;
}

export function bitLength(n: bigint): number {
  return n === 0n ? 1 : n.toString(2).length;
}

export function isqrt(n: bigint): bigint {
  if (n < 0n) throw new Error('isqrt of negative integer');
  if (n < 2n) return n;
  let x0 = 1n << BigInt(Math.ceil(bitLength(n) / 2));
  let x1 = (x0 + n / x0) >> 1n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + n / x0) >> 1n;
  }
  return x0;
}

export function isProbablePrime(n: bigint): boolean {
  if (n < 2n) return false;
  const small = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const p of small) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  // Deterministic for 64-bit, strong fixed-base probable-prime screen above that.
  const bases = n < 18446744073709551616n
    ? [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n]
    : [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  outer: for (const raw of bases) {
    const a = raw % n;
    if (a === 0n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) continue outer;
    }
    return false;
  }
  return true;
}


export type PrimalityAssessment = 'prime-deterministic-64' | 'probable-prime' | 'composite';

export function assessPrimality(n: bigint): PrimalityAssessment {
  if (!isProbablePrime(n)) return 'composite';
  return n < 18446744073709551616n ? 'prime-deterministic-64' : 'probable-prime';
}

export function primesUpTo(limit: number): number[] {
  if (limit < 2) return [];
  const sieve = new Uint8Array(limit + 1);
  const out: number[] = [];
  for (let p = 2; p <= limit; p++) {
    if (sieve[p]) continue;
    out.push(p);
    if (p * p <= limit) {
      for (let k = p * p; k <= limit; k += p) sieve[k] = 1;
    }
  }
  return out;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function clampInt(v: number, lo: number, hi: number): number {
  return Math.round(clamp(v, lo, hi));
}

export function product(values: bigint[]): bigint {
  return values.reduce((a, b) => a * b, 1n);
}

export class XorShift64 {
  state: bigint;
  constructor(seed: bigint) {
    this.state = BigInt.asUintN(64, seed || 0x9e3779b97f4a7c15n);
    if (this.state === 0n) this.state = 0x9e3779b97f4a7c15n;
  }
  nextU64(): bigint {
    let x = this.state;
    x ^= BigInt.asUintN(64, x << 13n);
    x ^= x >> 7n;
    x ^= BigInt.asUintN(64, x << 17n);
    this.state = BigInt.asUintN(64, x);
    return this.state;
  }
  between(min: bigint, maxExclusive: bigint): bigint {
    if (maxExclusive <= min) return min;
    return min + (this.nextU64() % (maxExclusive - min));
  }
}

export function seedFromString(text: string): bigint {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = BigInt.asUintN(64, h * 0x100000001b3n);
  }
  return h;
}
