import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { t as toCamel } from './dto-qzAL3BiV.js';
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

const PATCH = async ({
  params,
  request,
  locals,
  platform
}) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });
  const mappingId = params.id;
  const existing = await db.prepare(`SELECT * FROM group_app_mappings WHERE id = ? AND tenant_id = ?`).bind(mappingId, tenantId).first();
  if (!existing) {
    return json({ error: "mapping not found" }, { status: 404 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, { status: 400 });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updates = ["updated_at = ?"];
  const binds = [now];
  if (body.role !== void 0) {
    updates.push("role = ?");
    binds.push(body.role);
  }
  if (body.confirmed === true) {
    updates.push("suggested = 0");
  }
  binds.push(mappingId, tenantId);
  await db.prepare(
    `UPDATE group_app_mappings SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`
  ).bind(...binds).run();
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mapping.update",
    targetType: "group_app_mapping",
    targetId: mappingId,
    detail: JSON.stringify(body)
  });
  const updated = await db.prepare(`SELECT * FROM group_app_mappings WHERE id = ?`).bind(mappingId).first();
  return json({ mapping: toCamel(updated) });
};
const DELETE = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });
  const mappingId = params.id;
  const existing = await db.prepare(`SELECT * FROM group_app_mappings WHERE id = ? AND tenant_id = ?`).bind(mappingId, tenantId).first();
  if (!existing) {
    return json({ error: "mapping not found" }, { status: 404 });
  }
  await db.prepare(`DELETE FROM group_app_mappings WHERE id = ? AND tenant_id = ?`).bind(mappingId, tenantId).run();
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mapping.delete",
    targetType: "group_app_mapping",
    targetId: mappingId,
    detail: JSON.stringify({
      groupId: existing.group_id,
      appId: existing.app_id
    })
  });
  return json({ success: true });
};

export { DELETE, PATCH };
//# sourceMappingURL=_server.ts-CrSQq_5w.js.map
