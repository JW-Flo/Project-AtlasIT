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
  if (!db) return json({ groups: [] });
  const rows = await db.prepare(
    `SELECT g.*, (SELECT COUNT(*) FROM directory_memberships WHERE group_id = g.id) as member_count
       FROM directory_groups g
       WHERE g.tenant_id = ?
       ORDER BY g.name ASC`
  ).bind(tenantId).all().then((r) => r.results || []);
  return json({ groups: toCamel(rows) });
};
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body?.name) return json({ error: "name is required" }, { status: 400 });
  const { name, description } = body;
  const newId = crypto.randomUUID();
  const externalId = `manual:${newId}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO directory_groups (id, tenant_id, external_id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(newId, tenantId, externalId, name, description ?? null, now, now).run();
  const created = await db.prepare(
    `SELECT g.*, (SELECT COUNT(*) FROM directory_memberships WHERE group_id = g.id) as member_count
       FROM directory_groups g WHERE g.id = ?`
  ).bind(newId).first();
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "directory_group.created",
    targetType: "directory_group",
    targetId: newId,
    detail: name
  });
  return json({ group: toCamel(created) }, { status: 201 });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-B6g967FJ.js.map
