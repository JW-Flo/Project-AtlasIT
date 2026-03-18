import type { RequestHandler } from "@sveltejs/kit";

/** GET — list JML workflow runs for tenant */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const db = getSharedDb(platform);
  if (!db) return json({ error: "Database unavailable" }, 503);

  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "50", 10),
    200,
  );
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");

  let query = "SELECT * FROM workflow_runs WHERE tenant_id = ?";
  const params: unknown[] = [user.tenantId];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY started_at DESC LIMIT ?";
  params.push(limit);

  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all();

  return json({ runs: results ?? [] });
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
