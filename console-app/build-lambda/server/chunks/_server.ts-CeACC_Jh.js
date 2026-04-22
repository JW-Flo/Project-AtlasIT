import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { c as computeSlaBreachAt, D as DEFAULT_SLA_SECONDS } from './lifecycle-BLhc1MUq.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

function getDb(platform) {
  const env = platform?.env || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}
async function loadSlaConfig(db, tenantId) {
  try {
    const row = await db.prepare(
      "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'incident_sla_config'"
    ).bind(tenantId).first();
    if (row?.value) return JSON.parse(row.value);
  } catch {
  }
  return DEFAULT_SLA_SECONDS;
}
const VALID_SEVERITIES = ["low", "medium", "high", "critical"];
const PUT = async ({ params, request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin", "member"]);
  if (guard) return guard;
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const { id } = params;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const newSeverity = body?.severity;
  if (!newSeverity || !VALID_SEVERITIES.includes(newSeverity)) {
    return json(
      { error: `Invalid severity; must be one of: ${VALID_SEVERITIES.join(", ")}` },
      { status: 400 }
    );
  }
  const incident = await db.prepare("SELECT id, severity, created_at FROM incidents WHERE id = ? AND tenant_id = ?").bind(id, tenantId).first();
  if (!incident) {
    return json({ error: "Incident not found" }, { status: 404 });
  }
  if (incident.severity === newSeverity) {
    return json({ error: "Severity is already set to that value" }, { status: 422 });
  }
  const oldSeverity = incident.severity;
  const slaConfig = await loadSlaConfig(db, tenantId);
  const slaBreachAt = computeSlaBreachAt(incident.created_at, newSeverity, slaConfig);
  await db.prepare(
    "UPDATE incidents SET severity = ?, sla_breach_at = ?, sla_breach_notified = 0 WHERE id = ? AND tenant_id = ?"
  ).bind(newSeverity, slaBreachAt, id, tenantId).run();
  const timelineId = crypto.randomUUID().replace(/-/g, "");
  try {
    await db.prepare(
      `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content, metadata)
         VALUES (?, ?, ?, 'status_change', ?, ?, ?)`
    ).bind(
      timelineId,
      id,
      tenantId,
      user.email ?? "unknown",
      `Severity changed from ${oldSeverity} to ${newSeverity}`,
      JSON.stringify({ type: "severity_change", oldSeverity, newSeverity })
    ).run();
  } catch {
  }
  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "incident.severity_changed",
      targetType: "incident",
      targetId: id,
      detail: JSON.stringify({ oldSeverity, newSeverity })
    });
  } catch {
  }
  return json({ id, severity: newSeverity, slaBreachAt });
};

export { PUT };
//# sourceMappingURL=_server.ts-CeACC_Jh.js.map
