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
import type { EvidenceStore, EvidenceWriteResult } from "../platform/interfaces";
import type { StepState, RunState, EvidenceArtifact, EvidencePolicy } from "./types";
export interface EmitOptions {
    artifacts?: EvidenceArtifact[];
    policy?: EvidencePolicy;
    metadata?: Record<string, unknown>;
}
export declare class EvidenceEmitter {
    private readonly store;
    constructor(store: EvidenceStore);
    /**
     * Build and persist an immutable evidence envelope for a completed step.
     * Returns the content-addressed write result (key, uri, alreadyExists).
     */
    emit(run: RunState, step: StepState, options?: EmitOptions): Promise<EvidenceWriteResult>;
    private deriveEventType;
    private deriveOutcome;
}
//# sourceMappingURL=evidence-emitter.d.ts.map