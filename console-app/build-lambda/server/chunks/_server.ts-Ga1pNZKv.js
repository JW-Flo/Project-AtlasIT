import { json } from '@sveltejs/kit';
import { a as requireSuperAdmin } from './guards-rSzq6XQW.js';
import { t as toCamel } from './dto-qzAL3BiV.js';

const GET = async ({ locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const result = await db.prepare(
    `SELECT t.*, (SELECT COUNT(*) FROM console_users WHERE tenant_id = t.id) as user_count
       FROM tenants t ORDER BY t.created_at DESC`
  ).all();
  return json(toCamel(result.results ?? []));
};

export { GET };
//# sourceMappingURL=_server.ts-Ga1pNZKv.js.map
