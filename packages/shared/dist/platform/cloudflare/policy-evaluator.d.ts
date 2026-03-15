/**
 * Cloudflare-compatible OPA policy evaluator stub.
 *
 * For the controlled MVP, this evaluator works in two modes:
 * 1. Bundle mode: loads OPA WASM bundle from R2 (future)
 * 2. Inline mode: evaluates policies via a simple rule engine (MVP)
 *
 * All evaluations produce decision logs stored as evidence.
 */
import type { PolicyEvaluator } from "../interfaces.js";
export interface PolicyDecisionLog {
    decisionId: string;
    bundleRevision: string;
    query: string;
    input: unknown;
    result: {
        allow: boolean;
        deny?: string[];
    };
    timestamp: string;
}
export declare class CloudflarePolicyEvaluator implements PolicyEvaluator {
    private readonly bundleRevision;
    private readonly decisionLogs;
    constructor(bundleRevision?: string);
    evaluate(input: unknown): Promise<{
        decision: unknown;
        decisionId: string;
        bundleRevision: string;
    }>;
    /** Retrieve accumulated decision logs (for evidence emission). */
    getDecisionLogs(): PolicyDecisionLog[];
    /** Flush decision logs after they've been persisted as evidence. */
    flushDecisionLogs(): void;
}
//# sourceMappingURL=policy-evaluator.d.ts.map