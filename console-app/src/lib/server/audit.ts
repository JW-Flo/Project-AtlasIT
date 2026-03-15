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
        new Date().toISOString(),
      )
      .run();
  } catch (e) {
    console.error("audit write failed:", e);
  }
}
