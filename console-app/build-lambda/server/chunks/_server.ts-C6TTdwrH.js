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

const GET = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });
  const { id } = params;
  const directoryUser = await db.prepare(
    `SELECT id, external_id, email, display_name, department, title, status, source, console_user_id, created_at, updated_at
       FROM directory_users
       WHERE id = ? AND tenant_id = ?`
  ).bind(id, tenantId).first();
  if (!directoryUser) return json({ error: "not found" }, { status: 404 });
  const memberships = await db.prepare(
    `SELECT g.id, g.name, g.description, m.created_at as joined_at
       FROM directory_memberships m
       JOIN directory_groups g ON g.id = m.group_id
       WHERE m.user_id = ? AND m.tenant_id = ?
       ORDER BY g.name ASC`
  ).bind(id, tenantId).all().then((r) => r.results || []);
  return json({ user: toCamel(directoryUser), groups: toCamel(memberships) });
};
const PATCH = async ({
  params,
  request,
  locals,
  platform
}) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });
  const { id } = params;
  const existing = await db.prepare(`SELECT id FROM directory_users WHERE id = ? AND tenant_id = ?`).bind(id, tenantId).first();
  if (!existing) return json({ error: "not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "invalid body" }, { status: 400 });
  const { displayName, department, title, status } = body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const fields = [];
  const binds = [];
  if (displayName !== void 0) {
    fields.push("display_name = ?");
    binds.push(displayName);
  }
  if (department !== void 0) {
    fields.push("department = ?");
    binds.push(department);
  }
  if (title !== void 0) {
    fields.push("title = ?");
    binds.push(title);
  }
  if (status !== void 0) {
    const allowed = ["active", "inactive", "suspended"];
    if (!allowed.includes(status))
      return json(
        { error: `Invalid status. Must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    fields.push("status = ?");
    binds.push(status);
  }
  if (fields.length === 0)
    return json({ error: "no fields to update" }, { status: 400 });
  fields.push("updated_at = ?");
  binds.push(now, id, tenantId);
  await db.prepare(
    `UPDATE directory_users SET ${fields.join(", ")} WHERE id = ? AND tenant_id = ?`
  ).bind(...binds).run();
  const updated = await db.prepare(
    `SELECT id, external_id, email, display_name, department, title, status, source, console_user_id, created_at, updated_at
       FROM directory_users WHERE id = ? AND tenant_id = ?`
  ).bind(id, tenantId).first();
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "directory_user.updated",
    targetType: "directory_user",
    targetId: id
  });
  return json({ user: toCamel(updated) });
};
const DELETE = async ({ params, locals, platform }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });
  const { id } = params;
  const existing = await db.prepare(
    `SELECT id, email, console_user_id FROM directory_users WHERE id = ? AND tenant_id = ?`
  ).bind(id, tenantId).first();
  if (!existing) return json({ error: "not found" }, { status: 404 });
  if (existing.console_user_id) {
    return json(
      { error: "Cannot delete user with console access" },
      { status: 400 }
    );
  }
  await db.prepare(
    `DELETE FROM directory_memberships WHERE user_id = ? AND tenant_id = ?`
  ).bind(id, tenantId).run();
  await db.prepare(`DELETE FROM directory_users WHERE id = ? AND tenant_id = ?`).bind(id, tenantId).run();
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "directory_user.deleted",
    targetType: "directory_user",
    targetId: id,
    detail: existing.email
  });
  return json({ success: true });
};

export { DELETE, GET, PATCH };
//# sourceMappingURL=_server.ts-C6TTdwrH.js.map
