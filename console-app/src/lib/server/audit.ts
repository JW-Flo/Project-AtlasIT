import { lookupAuditEvidence, parseControlRef } from "@atlasit/shared";

export interface AuditEntry {
  tenantId: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
}

export async function writeAudit(db: any, entry: AuditEntry): Promise<void> {
  const now = new Date().toISOString();
  try {
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO audit_log (id, tenant_id, actor_user_id, actor_email, action, target_type, target_id, detail, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        entry.tenantId,
        entry.actorUserId,
        entry.actorEmail,
        entry.action,
        entry.targetType,
        entry.targetId ?? null,
        entry.detail ?? null,
        now,
      )
      .run();
  } catch (e) {
    console.error("audit write failed:", e);
  }

  // Dual-write compliance evidence when the audit action maps to a control
  const mapping = lookupAuditEvidence(entry.action);
  if (!mapping) return;

  for (const controlRef of mapping.controlRefs) {
    const { framework, controlId } = parseControlRef(controlRef);
    try {
      await db
        .prepare(
          `INSERT INTO compliance_evidence
           (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          entry.tenantId,
          framework,
          controlId,
          mapping.description,
          mapping.category,
          "platform",
          entry.targetId ?? null,
          entry.actorEmail,
          entry.detail ?? entry.targetType,
          JSON.stringify({
            impact: mapping.impact,
            eventType: entry.action,
            reasoning: mapping.description,
            confidence: 1.0,
            auditAction: entry.action,
          }),
          now,
        )
        .run();
    } catch {
      // Non-fatal — audit log already written
    }
  }
}
