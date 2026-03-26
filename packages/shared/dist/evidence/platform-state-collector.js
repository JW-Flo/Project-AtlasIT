/**
 * Platform state evidence collector — scans D1 tables for structural
 * compliance evidence (RBAC groups exist, audit logging active, etc.).
 *
 * Called by the ai-orchestrator cron to materialize state-based evidence
 * into compliance_evidence rows.
 */
import { PLATFORM_STATE_PROBES } from "./platform-evidence";
import { parseControlRef } from "./adapter-collector";
/**
 * Run all platform state probes for a tenant and write evidence rows.
 * Returns the number of evidence rows written.
 */
export async function collectPlatformStateEvidence(db, tenantId) {
    const results = [];
    let evidenceWritten = 0;
    const now = new Date().toISOString();
    for (const probe of PLATFORM_STATE_PROBES) {
        let status = "fail";
        try {
            const needsTenant = probe.query.includes("?");
            const row = needsTenant
                ? await db.prepare(probe.query).bind(tenantId).first()
                : await db.prepare(probe.query).first();
            status = row && row.result > 0 ? "pass" : "fail";
        }
        catch {
            // Table may not exist yet — treat as fail
            status = "fail";
        }
        results.push({
            probeId: probe.id,
            status,
            controlRefs: probe.controlRefs,
            description: probe.description,
        });
        if (status === "pass") {
            for (const controlRef of probe.controlRefs) {
                const { framework, controlId } = parseControlRef(controlRef);
                try {
                    // Upsert: use probe_id + control_id as a dedup key via source_id
                    const sourceId = `state:${probe.id}:${controlRef}`;
                    await db
                        .prepare(`INSERT INTO compliance_evidence
               (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET metadata = excluded.metadata, created_at = excluded.created_at`)
                        .bind(`state-${tenantId}-${probe.id}-${controlRef}`.replace(/[^a-zA-Z0-9-_.]/g, "_"), tenantId, framework, controlId, probe.description, probe.category, "platform_state", sourceId, "system", probe.description, JSON.stringify({
                        impact: "positive",
                        eventType: `state_probe:${probe.id}`,
                        reasoning: probe.description,
                        confidence: 1.0,
                        probeId: probe.id,
                        decision: "pass",
                    }), now)
                        .run();
                    evidenceWritten++;
                }
                catch {
                    // Non-fatal
                }
            }
        }
    }
    return { results, evidenceWritten };
}
//# sourceMappingURL=platform-state-collector.js.map