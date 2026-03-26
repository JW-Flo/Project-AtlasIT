import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ entries: [], total: 0 });

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10) || 0;
  const actionFilter = url.searchParams.get("action") ?? null;
  const from = url.searchParams.get("from") ?? null;
  const to = url.searchParams.get("to") ?? null;

  const filters: string[] = [];
  const bindArgs: (string | number)[] = [];

  if (!user.superAdmin) {
    filters.push("tenant_id = ?");
    bindArgs.push(user.tenantId);
  }
  if (actionFilter) {
    filters.push("action = ?");
    bindArgs.push(actionFilter);
  }
  if (from) {
    filters.push("created_at >= ?");
    bindArgs.push(from);
  }
  if (to) {
    filters.push("created_at <= ?");
    bindArgs.push(to + "T23:59:59.999Z");
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM audit_log ${whereClause}`)
    .bind(...bindArgs)
    .first()
    .catch(() => ({ total: 0 }));

  const result = await db
    .prepare(
      `SELECT id, tenant_id, actor_email, action, target_type, target_id, detail, created_at
       FROM audit_log ${whereClause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .bind(...bindArgs, limit, offset)
    .all()
    .catch(() => ({ results: [] }));

  const entries = (result.results ?? []).map((row: any) => ({
    date: row.created_at,
    actor: row.actor_email,
    action: row.action,
    target: row.target_type + (row.target_id ? `:${row.target_id}` : ""),
    details: row.detail || "",
  }));

  return json({ entries, total: (countResult as any)?.total ?? 0 });
};
