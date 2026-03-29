import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

export const GET: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const { id } = params;

  try {
    const incident = await db
      .prepare("SELECT * FROM incidents WHERE id = ? AND tenant_id = ?")
      .bind(id, tenantId)
      .first<Record<string, unknown>>();

    if (!incident) {
      return json({ error: "Incident not found" }, { status: 404 });
    }

    const { results: timelineRows } = await db
      .prepare(
        "SELECT * FROM incident_timeline WHERE incident_id = ? AND tenant_id = ? ORDER BY created_at ASC",
      )
      .bind(id, tenantId)
      .all();

    const timeline = (timelineRows ?? []).map((row: any) => ({
      id: row.id,
      entryType: row.entry_type,
      actorEmail: row.actor_email ?? null,
      content: row.content ?? null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
    }));

    return json({
      id: incident.id,
      tenantId: incident.tenant_id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      source: incident.source ?? null,
      sourceId: incident.source_id ?? null,
      description: incident.description ?? null,
      ownerEmail: incident.owner_email ?? null,
      ownerId: incident.owner_id ?? null,
      investigatingAt: incident.investigating_at ?? null,
      slaBreachAt: incident.sla_breach_at ?? null,
      createdAt: incident.created_at,
      resolvedAt: incident.resolved_at ?? null,
      timeline,
    });
  } catch (e: any) {
    if (e?.message?.includes("no such table")) {
      return json({ error: "Incident not found" }, { status: 404 });
    }
    return json({ error: "Failed to load incident" }, { status: 500 });
  }
};
