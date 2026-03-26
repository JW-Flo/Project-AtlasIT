/**
 * Cloudflare-compatible OPA policy evaluator stub.
 *
 * For the controlled MVP, this evaluator works in two modes:
 * 1. Bundle mode: loads OPA WASM bundle from R2 (future)
 * 2. Inline mode: evaluates policies via a simple rule engine (MVP)
 *
 * All evaluations produce decision logs stored as evidence.
 */
export class CloudflarePolicyEvaluator {
    bundleRevision;
    decisionLogs = [];
    constructor(bundleRevision = "inline-v1") {
        this.bundleRevision = bundleRevision;
    }
    async evaluate(input) {
        const decisionId = crypto.randomUUID();
        const typedInput = input;
        const action = typedInput.action ?? "";
        const roles = typedInput.subject?.roles ?? [];
        // Default-deny evaluation
        let allow = false;
        const deny = [];
        // Check authorization rules
        if (action === "workflow.execute" && roles.includes("automation:execute")) {
            allow = true;
        }
        else if (action === "evidence.read" && roles.includes("evidence:read")) {
            allow = true;
        }
        else if (roles.some((r) => r.startsWith("admin:"))) {
            allow = true;
        }
        // Check deny rules
        if (action === "retention.purge" && !roles.includes("admin:retention")) {
            deny.push("missing required role admin:retention");
            allow = false;
        }
        const decision = { allow, deny: deny.length > 0 ? deny : undefined };
        // Record decision log
        const log = {
            decisionId,
            bundleRevision: this.bundleRevision,
            query: `data.atlasit.authz.allow`,
            input,
            result: { allow, deny },
            timestamp: new Date().toISOString(),
        };
        this.decisionLogs.push(log);
        return {
            decision,
            decisionId,
            bundleRevision: this.bundleRevision,
        };
    }
    /** Retrieve accumulated decision logs (for evidence emission). */
    getDecisionLogs() {
        return [...this.decisionLogs];
    }
    /** Flush decision logs after they've been persisted as evidence. */
    flushDecisionLogs() {
        this.decisionLogs.length = 0;
    }
}
//# sourceMappingURL=policy-evaluator.js.map