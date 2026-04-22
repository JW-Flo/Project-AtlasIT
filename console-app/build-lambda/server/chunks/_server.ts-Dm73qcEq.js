import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
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
  const ownerEmail = body?.ownerEmail;
  if (!ownerEmail || typeof ownerEmail !== "string") {
    return json({ error: "Missing required field: ownerEmail" }, { status: 400 });
  }
  const incident = await db.prepare("SELECT id, owner_email FROM incidents WHERE id = ? AND tenant_id = ?").bind(id, tenantId).first();
  if (!incident) {
    return json({ error: "Incident not found" }, { status: 404 });
  }
  const assignee = await db.prepare("SELECT email FROM console_user_roles WHERE email = ? AND tenant_id = ?").bind(ownerEmail, tenantId).first();
  if (!assignee) {
    return json({ error: "Assignee not found in tenant" }, { status: 422 });
  }
  await db.prepare("UPDATE incidents SET owner_email = ? WHERE id = ? AND tenant_id = ?").bind(ownerEmail, id, tenantId).run();
  const timelineId = crypto.randomUUID().replace(/-/g, "");
  await db.prepare(
    `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content, metadata)
       VALUES (?, ?, ?, 'assignment', ?, ?, ?)`
  ).bind(
    timelineId,
    id,
    tenantId,
    user.email ?? "unknown",
    `Assigned to ${ownerEmail}`,
    JSON.stringify({ previousOwner: incident.owner_email ?? null, newOwner: ownerEmail })
  ).run();
  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "incident.assigned",
      targetType: "incident",
      targetId: id,
      detail: JSON.stringify({ ownerEmail })
    });
  } catch {
  }
  try {
    const { notify } = await import('./notifications-COLEq-wV.js');
    const assigneeUser = await db.prepare("SELECT id FROM console_users WHERE email = ? AND tenant_id = ?").bind(ownerEmail, tenantId).first();
    await notify(db, platform, {
      tenantId,
      userId: assigneeUser?.id || null,
      type: "incident_assigned",
      title: `Incident assigned to you`,
      body: `You've been assigned to incident ${id} by ${user.email}`,
      severity: "warning",
      sourceType: "incident",
      sourceId: id,
      sourceLabel: ownerEmail,
      actionUrl: `/console/incidents`
    });
  } catch {
  }
  return json({ id, ownerEmail });
};

export { PUT };
//# sourceMappingURL=_server.ts-Dm73qcEq.js.map
