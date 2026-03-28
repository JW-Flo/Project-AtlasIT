import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  let query = "SELECT * FROM incidents WHERE tenant_id = ?";
  const params: unknown[] = [tenantId];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (severity) {
    query += " AND severity = ?";
    params.push(severity);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  try {
    const { results } = await db.prepare(query).bind(...params).all();
    const items = (results ?? []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      title: row.title,
      severity: row.severity,
      status: row.status,
      source: row.source ?? null,
      sourceId: row.source_id ?? null,
      description: row.description ?? null,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at ?? null,
    }));
    return json({ items });
  } catch (e: any) {
    // Table may not exist yet — return empty
    if (e?.message?.includes("no such table")) {
      return json({ items: [] });
    }
    return json({ error: "Failed to load incidents" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
    if (!body || typeof body.title !== "string" || !body.title.trim()) {
      return json({ error: "Missing required field: title" }, { status: 400 });
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = crypto.randomUUID().replace(/-/g, "");
  const severity = body.severity || "medium";
  const description = body.description || "";

  try {
    await db
      .prepare(
        `INSERT INTO incidents (id, tenant_id, title, severity, status, source, description)
         VALUES (?, ?, ?, ?, 'open', 'manual', ?)`,
      )
      .bind(id, tenantId, body.title, severity, description)
      .run();
  } catch (e: any) {
    return json({ error: `Failed to create incident: ${e?.message}` }, { status: 500 });
  }

  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "incident.created",
      targetType: "incident",
      targetId: id,
      detail: JSON.stringify({ title: body.title }),
    });
  } catch {
    // Non-blocking
  }

  return json({ id, title: body.title, severity, status: "open" }, { status: 201 });
};
