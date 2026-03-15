/**
 * Evidence emitter: produces immutable, content-addressed evidence envelopes
 * after each workflow step completes (success OR failure).
 *
 * Envelope hash = sha256(canonical_json(envelope_without_hash))
 * Storage path  = evidence/<tenantId>/<runId>/<stepId>/<hash>.json
 *
 * Writes are idempotent: if the hash already exists in the store, the write
 * is a no-op. This makes replays safe.
 */
// ---------------------------------------------------------------------------
// Canonical JSON + SHA-256 (edge-compatible, no Node.js crypto dependency)
// ---------------------------------------------------------------------------
function normalise(value) {
    if (value === null)
        return null;
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean")
        return value;
    if (t === "bigint")
        return value.toString();
    if (Array.isArray(value)) {
        return value.map((item) => {
            const n = normalise(item);
            return n === undefined ? null : n;
        });
    }
    if (t === "object") {
        const candidate = value;
        if (typeof candidate.toJSON === "function") {
            return normalise(candidate.toJSON());
        }
        const keys = Object.keys(candidate).sort();
        const out = {};
        for (const key of keys) {
            const n = normalise(candidate[key]);
            if (n !== undefined) {
                out[key] = n;
            }
        }
        return out;
    }
    return undefined;
}
function canonicalize(value) {
    return JSON.stringify(normalise(value));
}
function toHex(buffer) {
    const bytes = new Uint8Array(buffer);
    let hex = "";
    for (const b of bytes) {
        hex += b.toString(16).padStart(2, "0");
    }
    return hex;
}
async function sha256Hex(data) {
    const bytes = new TextEncoder().encode(data);
    // Prefer Web Crypto (works on CF Workers and Node 20+)
    if (globalThis.crypto?.subtle) {
        const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
        return toHex(digest);
    }
    // Fallback for Node.js environments without globalThis.crypto.subtle
    const { webcrypto } = await import("node:crypto");
    const digest = await webcrypto.subtle.digest("SHA-256", bytes);
    return toHex(digest);
}
// ---------------------------------------------------------------------------
// EvidenceEmitter
// ---------------------------------------------------------------------------
export class EvidenceEmitter {
    store;
    constructor(store) {
        this.store = store;
    }
    /**
     * Build and persist an immutable evidence envelope for a completed step.
     * Returns the content-addressed write result (key, uri, alreadyExists).
     */
    async emit(run, step, options = {}) {
        if (!run.tenantId) {
            throw new Error("Evidence emission requires a non-empty tenantId");
        }
        const eventType = this.deriveEventType(step);
        const outcome = this.deriveOutcome(step);
        // Build envelope WITHOUT hash first
        const partial = {
            tenantId: run.tenantId,
            workflowRunId: run.id,
            stepId: step.stepId,
            actor: run.actor,
            eventType,
            createdAt: step.completedAt ?? new Date().toISOString(),
            outcome,
            durationMs: step.durationMs,
        };
        if (step.error) {
            partial.error = step.error;
        }
        if (options.artifacts && options.artifacts.length > 0) {
            partial.artifacts = options.artifacts;
        }
        if (options.policy) {
            partial.policy = options.policy;
        }
        if (options.metadata && Object.keys(options.metadata).length > 0) {
            partial.metadata = options.metadata;
        }
        // Compute content-addressed hash
        const canonical = canonicalize(partial);
        const hash = await sha256Hex(canonical);
        // Assemble final envelope
        const envelope = { ...partial, hash };
        // Serialize and persist
        const body = JSON.stringify(envelope);
        return this.store.put(run.tenantId, run.id, step.stepId, hash, body);
    }
    deriveEventType(step) {
        switch (step.status) {
            case "completed":
                return "step.completed";
            case "failed":
                return "step.failed";
            case "skipped":
                return "step.skipped";
            default:
                return `step.${step.status}`;
        }
    }
    deriveOutcome(step) {
        switch (step.status) {
            case "completed":
                return "success";
            case "failed":
                return "failure";
            case "skipped":
                return "skipped";
            default:
                return "success";
        }
    }
}
//# sourceMappingURL=evidence-emitter.js.map