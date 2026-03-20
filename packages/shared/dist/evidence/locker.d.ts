/**
 * Evidence Locker
 *
 * Writes classified evidence to both:
 *   1. R2 (immutable, content-addressed, tamper-evident) — the audit trail
 *   2. D1 compliance_evidence (queryable, indexed) — for scoring + feed
 *
 * Each evidence item stored in R2 gets:
 *   - SHA-256 content hash (tamper detection)
 *   - Control tags (which controls it affects)
 *   - Impact direction (positive/detrimental/neutral)
 *   - Full payload snapshot
 *
 * Tenant-scoped: evidence is partitioned by tenant_id in both R2 paths and D1 queries.
 */
import type { ClassifiedEvidence, ControlClassification } from "./classifier.ts";
export interface EvidenceLockerItem {
    id: string;
    tenantId: string;
    eventType: string;
    source: string;
    actor: string;
    subject: string | null;
    controls: ControlClassification[];
    payload: Record<string, unknown>;
    contentHash: string;
    r2Key: string;
    classifiedAt: string;
    storedAt: string;
}
export interface LockerWriteResult {
    id: string;
    contentHash: string;
    r2Key: string;
    controlsTagged: number;
    d1RowsWritten: number;
    alreadyExists: boolean;
}
export interface LockerDependencies {
    db: D1Database;
    bucket?: R2Bucket;
}
/**
 * Store classified evidence in the evidence locker.
 *
 * 1. Compute content hash for tamper detection
 * 2. Write immutable envelope to R2 (if bucket available)
 * 3. Write one row per control to compliance_evidence in D1
 *    (each control tag gets its own row for granular scoring)
 */
export declare function storeEvidence(deps: LockerDependencies, evidence: ClassifiedEvidence): Promise<LockerWriteResult>;
/**
 * Query evidence from the locker for a specific tenant.
 * Supports filtering by framework, control, category, impact, and time range.
 */
export declare function queryEvidence(db: D1Database, tenantId: string, options?: {
    framework?: string;
    controlId?: string;
    category?: string;
    impact?: string;
    since?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    items: Record<string, unknown>[];
    total: number;
}>;
//# sourceMappingURL=locker.d.ts.map