/**
 * Platform state evidence collector — scans D1 tables for structural
 * compliance evidence (RBAC groups exist, audit logging active, etc.).
 *
 * Called by the ai-orchestrator cron to materialize state-based evidence
 * into compliance_evidence rows.
 */
export interface StateEvidenceResult {
    probeId: string;
    status: "pass" | "fail";
    controlRefs: string[];
    description: string;
}
/**
 * Run all platform state probes for a tenant and write evidence rows.
 * Returns the number of evidence rows written.
 */
export declare function collectPlatformStateEvidence(db: D1Database, tenantId: string): Promise<{
    results: StateEvidenceResult[];
    evidenceWritten: number;
}>;
//# sourceMappingURL=platform-state-collector.d.ts.map