import type { RequestHandler } from "@sveltejs/kit";
import { toCamel } from "$lib/utils/dto";

/** GET — list directory changelog entries */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const db = getSharedDb(platform);
  if (!db) return json({ error: "Database unavailable" }, 503);

  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "50", 10),
    200,
  );
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10), 0);
  const action = url.searchParams.get("action");

  const filters: string[] = ["tenant_id = ?"];
  const params: unknown[] = [user.tenantId];

  if (action) {
    filters.push("jml_action = ?");
    params.push(action);
  }

  const where = filters.join(" AND ");

  const [{ results }, countRow] = await Promise.all([
    db
      .prepare(`SELECT * FROM directory_changelog WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...params, limit, offset)
      .all(),
    db
      .prepare(`SELECT COUNT(*) AS cnt FROM directory_changelog WHERE ${where}`)
      .bind(...params)
      .first<{ cnt: number }>(),
  ]);

  return json({ entries: toCamel(results ?? []), total: countRow?.cnt ?? 0 });
};

function getSharedDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.DB ?? env.ATLAS_SHARED_DB ?? null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
