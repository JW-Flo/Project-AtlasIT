import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { v as validateStatusTransition } from './lifecycle-BLhc1MUq.js';
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
  const newStatus = body?.status;
  if (!newStatus || typeof newStatus !== "string") {
    return json({ error: "Missing required field: status" }, { status: 400 });
  }
  const incident = await db.prepare("SELECT id, status FROM incidents WHERE id = ? AND tenant_id = ?").bind(id, tenantId).first();
  if (!incident) {
    return json({ error: "Incident not found" }, { status: 404 });
  }
  if (!validateStatusTransition(incident.status, newStatus)) {
    return json(
      { error: `Invalid transition: ${incident.status} → ${newStatus}` },
      { status: 422 }
    );
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (newStatus === "investigating") {
    await db.prepare("UPDATE incidents SET status = 'investigating', investigating_at = ? WHERE id = ? AND tenant_id = ?").bind(now, id, tenantId).run();
  } else if (newStatus === "resolved") {
    await db.prepare("UPDATE incidents SET status = 'resolved', resolved_at = ? WHERE id = ? AND tenant_id = ?").bind(now, id, tenantId).run();
  }
  const timelineId = crypto.randomUUID().replace(/-/g, "");
  await db.prepare(
    `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content, metadata)
       VALUES (?, ?, ?, 'status_change', ?, ?, ?)`
  ).bind(
    timelineId,
    id,
    tenantId,
    user.email ?? "unknown",
    body.comment || `Status changed to ${newStatus}`,
    JSON.stringify({ oldStatus: incident.status, newStatus })
  ).run();
  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: `incident.${newStatus}`,
      targetType: "incident",
      targetId: id,
      detail: JSON.stringify({ oldStatus: incident.status, newStatus })
    });
  } catch {
  }
  return json({ id, status: newStatus, updatedAt: now });
};

export { PUT };
//# sourceMappingURL=_server.ts-Ih5r5pCA.js.map
