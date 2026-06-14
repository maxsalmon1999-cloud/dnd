// ---------------------------------------------------------------------------
// Client for the AI proxy worker.
// Phase 0 only proves the worker is REACHABLE (a free CORS preflight check, no
// AI tokens spent). Phase 1 will add the real prompt-send + streaming logic.
// ---------------------------------------------------------------------------
import { WORKER_URL } from '../config'

// Sends a CORS preflight (OPTIONS) to confirm the worker is alive and reachable.
// This does NOT call the AI and costs nothing.
export async function pingWorker() {
  const res = await fetch(WORKER_URL, { method: 'OPTIONS' })
  if (!res.ok && res.status !== 204) {
    throw new Error(`Worker responded with HTTP ${res.status}`)
  }
  return true
}
