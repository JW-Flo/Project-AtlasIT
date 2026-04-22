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

const PATCH = async ({
  params,
  request,
  locals,
  platform
}) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const { roles } = body;
  if (!roles || !Array.isArray(roles)) {
    return json({ error: "roles array required" }, { status: 400 });
  }
  if (!roles.includes("owner")) {
    const target = await db.prepare(`SELECT roles FROM console_users WHERE id = ? AND tenant_id = ?`).bind(params.id, user.tenantId).first();
    if (target) {
      const targetRoles = JSON.parse(target.roles);
      if (targetRoles.includes("owner")) {
        const ownerCount = await db.prepare(
          `SELECT COUNT(*) as cnt FROM console_users WHERE tenant_id = ? AND roles LIKE '%owner%'`
        ).bind(user.tenantId).first();
        if (ownerCount && ownerCount.cnt <= 1) {
          return json(
            { error: "Cannot remove the last owner" },
            { status: 400 }
          );
        }
      }
    }
  }
  await db.prepare(
    `UPDATE console_users SET roles = ? WHERE id = ? AND tenant_id = ?`
  ).bind(JSON.stringify(roles), params.id, user.tenantId).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "user.roles_updated",
    targetType: "user",
    targetId: params.id,
    detail: JSON.stringify({ roles })
  });
  return json({ success: true });
};
const DELETE = async ({ params, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  if (params.id === user.userId) {
    return json({ error: "Cannot delete yourself" }, { status: 400 });
  }
  const target = await db.prepare(`SELECT roles FROM console_users WHERE id = ? AND tenant_id = ?`).bind(params.id, user.tenantId).first();
  if (!target) {
    return json({ error: "User not found" }, { status: 404 });
  }
  const targetRoles = JSON.parse(target.roles);
  if (targetRoles.includes("owner")) {
    const ownerCount = await db.prepare(
      `SELECT COUNT(*) as cnt FROM console_users WHERE tenant_id = ? AND roles LIKE '%owner%'`
    ).bind(user.tenantId).first();
    if (ownerCount && ownerCount.cnt <= 1) {
      return json({ error: "Cannot remove the last owner" }, { status: 400 });
    }
  }
  await db.prepare(`DELETE FROM console_users WHERE id = ? AND tenant_id = ?`).bind(params.id, user.tenantId).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "user.deleted",
    targetType: "user",
    targetId: params.id
  });
  return json({ success: true });
};

export { DELETE, PATCH };
//# sourceMappingURL=_server.ts-B6x96XDb.js.map
