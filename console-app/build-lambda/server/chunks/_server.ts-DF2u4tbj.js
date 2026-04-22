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

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ mappings: [] });
  const rows = await db.prepare(
    `SELECT m.*, g.name as group_name
       FROM group_app_mappings m
       LEFT JOIN directory_groups g ON g.id = m.group_id
       WHERE m.tenant_id = ?
       ORDER BY g.name ASC, m.app_id ASC`
  ).bind(tenantId).all().then((r) => r.results || []);
  return json({ mappings: toCamel(rows) });
};
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, { status: 400 });
  }
  const { groupId, appId, role } = body;
  if (!groupId || !appId) {
    return json({ error: "groupId and appId are required" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO group_app_mappings (id, tenant_id, group_id, app_id, role, suggested, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
  ).bind(id, tenantId, groupId, appId, role || "member", now, now).run();
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mapping.create",
    targetType: "group_app_mapping",
    targetId: id,
    detail: JSON.stringify({ groupId, appId, role: role || "member" })
  });
  const row = await db.prepare(`SELECT * FROM group_app_mappings WHERE id = ?`).bind(id).first();
  return json({ mapping: toCamel(row) });
};
const DELETE = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });
  const mappingId = url.searchParams.get("id");
  if (!mappingId) return json({ error: "mapping id required" }, { status: 400 });
  await db.prepare("DELETE FROM group_app_mappings WHERE id = ? AND tenant_id = ?").bind(mappingId, tenantId).run();
  return json({ success: true });
};
const PATCH = async ({ request, url, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });
  const mappingId = url.searchParams.get("id");
  if (!mappingId) return json({ error: "mapping id required" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const { confirmed, role } = body;
  const updates = [];
  const params = [];
  if (confirmed !== void 0) {
    updates.push("suggested = ?");
    params.push(confirmed ? 0 : 1);
  }
  if (role) {
    updates.push("role = ?");
    params.push(role);
  }
  if (updates.length === 0) return json({ error: "nothing to update" }, { status: 400 });
  updates.push("updated_at = ?");
  params.push((/* @__PURE__ */ new Date()).toISOString());
  params.push(mappingId, tenantId);
  await db.prepare(`UPDATE group_app_mappings SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`).bind(...params).run();
  return json({ success: true });
};

export { DELETE, GET, PATCH, POST };
//# sourceMappingURL=_server.ts-DF2u4tbj.js.map
