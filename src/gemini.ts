import { createInitialHRMState } from './augmentation';
import { compileDirective } from './hieromath';
import { bitLength } from './math';
import type { AdvisoryGuidance, Method } from './types';

export function smallPrimeResidueFingerprint(n: bigint): number[] {
  return [101n, 103n, 107n, 109n, 113n, 127n, 131n, 137n].map(p => Number(n % p) / Number(p));
}

export async function getGeminiGuidance(targetText: string, method: Method, replaySeed: string): Promise<AdvisoryGuidance> {
  const n = BigInt(targetText.trim());
  const bits = bitLength(n);
  const digits = n.toString().length;
  const hrmState = createInitialHRMState(replaySeed);
  const directive = compileDirective(hrmState, method, bits, digits, replaySeed);
  const payload = {
    objective: 'semiprime-prime-factorization',
    method,
    digitLength: digits,
    bitLength: bits,
    smallPrimeResidueFingerprint: smallPrimeResidueFingerprint(n),
    hrmState,
    hieromathDirective: directive
  };
  const response = await fetch('/api/gemini-guidance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(text || `Gemini advisory failed (${response.status})`);
  }
  return response.json() as Promise<AdvisoryGuidance>;
}
