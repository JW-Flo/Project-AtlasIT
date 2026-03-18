import type { RequestHandler } from "@sveltejs/kit";

/** GET — fetch recent activity stream for tenant */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const db = getSharedDb(platform);
  if (!db) return json({ error: "Database unavailable" }, 503);

  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "50", 10),
    200,
  );
  const afterId = parseInt(url.searchParams.get("after") ?? "0", 10);
  const types = url.searchParams.get("types")?.split(",").filter(Boolean);

  let query = "SELECT * FROM activity_stream WHERE tenant_id = ?";
  const params: unknown[] = [user.tenantId];

  if (afterId > 0) {
    query += " AND id > ?";
    params.push(afterId);
  }

  if (types && types.length > 0) {
    const placeholders = types.map(() => "?").join(",");
    query += ` AND event_type IN (${placeholders})`;
    params.push(...types);
  }

  query += " ORDER BY id DESC LIMIT ?";
  params.push(limit);

  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all();

  return json({
    activities: (results ?? []).map((row: any) => ({
      id: row.id,
      eventType: row.event_type,
      title: row.title,
      detail: row.detail,
      severity: row.severity,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actor: row.actor,
      metadata: safeJsonParse(row.metadata),
      createdAt: row.created_at,
    })),
  });
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

function safeJsonParse(val: string | null | undefined): unknown {
  if (!val) return {};
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
}
