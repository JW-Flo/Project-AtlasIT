import type { RequestHandler } from "@sveltejs/kit";

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
  const action = url.searchParams.get("action");

  let query = "SELECT * FROM directory_changelog WHERE tenant_id = ?";
  const params: unknown[] = [user.tenantId];

  if (action) {
    query += " AND jml_action = ?";
    params.push(action);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all();

  return json({ entries: results ?? [] });
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
