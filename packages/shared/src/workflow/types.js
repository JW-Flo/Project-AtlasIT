/**
 * Workflow run types and state schema.
 *
 * Schema version is embedded in every persisted run state to support
 * forward-compatible migrations. Hash computation uses canonical JSON
 * (sorted keys, no whitespace) via sha-256.
 */
/** Current schema version — bump on any breaking state shape change. */
export const WORKFLOW_STATE_SCHEMA_VERSION = 1;
/** Maximum retries before a step is routed to the DLQ. */
export const DEFAULT_MAX_RETRIES = 3;
/** Base delay in milliseconds for exponential backoff. */
export const BACKOFF_BASE_MS = 2_000;
/** Maximum delay cap in milliseconds. */
export const BACKOFF_MAX_MS = 120_000;
// ---------------------------------------------------------------------------
// Canonical JSON helper for deterministic hashing
// ---------------------------------------------------------------------------
/**
 * Produce canonical JSON: sorted keys, no extra whitespace.
 * Used for deterministic hashing of state and evidence envelopes.
 */
export function canonicalJson(value) {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce((sorted, k) => {
          sorted[k] = val[k];
          return sorted;
        }, {});
    }
    return val;
  });
}
/**
 * Compute SHA-256 hex digest of a string.
 * Works in both Workers (crypto.subtle) and Node (globalThis.crypto).
 */
export async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
