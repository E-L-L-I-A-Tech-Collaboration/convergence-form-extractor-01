/// <reference lib="webworker" />
import { factorize } from './factorization';
import type { WorkerIn, WorkerOut } from './types';

let cancelled = false;
const send = (message: WorkerOut) => self.postMessage(message);

self.onmessage = (event: MessageEvent<WorkerIn>) => {
  const msg = event.data;
  if (msg.type === 'cancel') {
    cancelled = true;
    return;
  }
  if (msg.type === 'factor') {
    cancelled = false;
    try {
      const result = factorize(
        msg.request,
        (message, fraction, hrm, directive) => send({ type: 'progress', message, fraction, hrm, directive }),
        () => cancelled
      );
      send({ type: 'result', result });
    } catch (error) {
      send({ type: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  }
};
