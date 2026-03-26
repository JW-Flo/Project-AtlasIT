/**
 * Platform evidence — maps AtlasIT's own audit actions and system state
 * to compliance control references. This lets the evidence locker show
 * real compliance-relevant activity from day one, without external adapters.
 *
 * Two collection modes:
 *   1. **Event-driven** — writeAudit() dual-writes a compliance_evidence row
 *      when the action matches a known mapping (real-time).
 *   2. **State-based** — a cron scans D1 tables for structural evidence
 *      (e.g. RBAC groups exist, audit logging active, retention configured).
 */
export interface AuditEvidenceMapping {
    /** audit_log.action value */
    action: string;
    /** Compliance control refs this action provides evidence for */
    controlRefs: string[];
    /** positive = supports compliance, detrimental = risk indicator */
    impact: "positive" | "detrimental" | "neutral";
    /** Human description for the evidence feed */
    description: string;
    /** Evidence category for filtering */
    category: string;
}
/**
 * Registry mapping platform audit actions → compliance evidence.
 *
 * Every writeAudit() call checks this registry. When the action matches,
 * a compliance_evidence row is created alongside the audit_log row.
 */
export declare const AUDIT_EVIDENCE_REGISTRY: AuditEvidenceMapping[];
export declare function lookupAuditEvidence(action: string): AuditEvidenceMapping | undefined;
export interface PlatformStateProbe {
    id: string;
    controlRefs: string[];
    description: string;
    category: string;
    /**
     * SQL query that returns { result: number } — a non-zero value means
     * the control condition is satisfied (pass), zero means fail.
     */
    query: string;
}
/**
 * Probes that scan D1 tables to derive evidence from platform state.
 * Run periodically (cron) rather than per-event.
 */
export declare const PLATFORM_STATE_PROBES: PlatformStateProbe[];
//# sourceMappingURL=platform-evidence.d.ts.map