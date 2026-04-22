import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner", "admin"]);
  if (denied) return denied;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const result = await db.prepare(
    `SELECT id, email, display_name, roles, created_at, last_login
       FROM console_users WHERE tenant_id = ?`
  ).bind(user.tenantId).all();
  const users = (result.results ?? []).map((row) => {
    let parsedRoles = [];
    try {
      parsedRoles = typeof row.roles === "string" ? JSON.parse(row.roles) : row.roles ?? [];
    } catch {
      parsedRoles = [];
    }
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name ?? row.displayName,
      role: parsedRoles[0] ?? "viewer",
      roles: parsedRoles,
      createdAt: row.created_at ?? row.createdAt,
      lastLogin: row.last_login ?? row.lastLogin ?? null
    };
  });
  return json(users);
};

export { GET };
//# sourceMappingURL=_server.ts-B5-8bXdl.js.map
