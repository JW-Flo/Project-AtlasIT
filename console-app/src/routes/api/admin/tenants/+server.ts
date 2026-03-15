import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireSuperAdmin } from "$lib/server/guards";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const result = await db
    .prepare(
      `SELECT t.*, (SELECT COUNT(*) FROM console_users WHERE tenant_id = t.id) as user_count
       FROM tenants t ORDER BY t.created_at DESC`,
    )
    .all();

  return json(result.results ?? []);
};
