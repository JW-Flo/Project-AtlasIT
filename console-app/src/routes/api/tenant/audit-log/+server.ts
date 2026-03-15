import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner", "admin"]);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "50", 10) || 50,
    200,
  );
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10) || 0;

  const result = await db
    .prepare(
      `SELECT * FROM audit_log WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .bind(user!.tenantId, limit, offset)
    .all();

  return json(result.results ?? []);
};
