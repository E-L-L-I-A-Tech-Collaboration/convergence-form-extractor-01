import type { LedgerEvent, LedgerSnapshot } from './types';

function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'bigint') return `{"$bigint":"${value.toString()}"}`;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return JSON.stringify(String(value));
    return JSON.stringify(Number(value.toFixed(15)));
  }
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

export function fnv1a64(text: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = BigInt.asUintN(64, h * prime);
  }
  return h.toString(16).padStart(16, '0');
}

export class BinarySemanticLedger {
  readonly replaySeed: string;
  readonly events: LedgerEvent[] = [];
  private headHash = '0000000000000000';

  constructor(replaySeed: string) {
    this.replaySeed = replaySeed;
    this.append('RUN_INIT', { replaySeed, schema: 'binary-semantic-ledger-v1' });
  }

  append(type: string, payload: unknown): LedgerEvent {
    const index = this.events.length;
    const recordCore = {
      index,
      type,
      timestampLogical: index,
      payload,
      prevHash: this.headHash
    };
    const hash = fnv1a64(canonicalize(recordCore));
    const event: LedgerEvent = { ...recordCore, hash };
    this.events.push(event);
    this.headHash = hash;
    return event;
  }

  snapshot(): LedgerSnapshot {
    return {
      replaySeed: this.replaySeed,
      head: this.headHash,
      events: this.events.map(e => ({ ...e }))
    };
  }
}
