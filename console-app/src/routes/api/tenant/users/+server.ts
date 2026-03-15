import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner", "admin"]);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const result = await db
    .prepare(
      `SELECT id, email, display_name, roles, created_at, last_login
       FROM console_users WHERE tenant_id = ?`,
    )
    .bind(user!.tenantId)
    .all();

  return json(result.results ?? []);
};
