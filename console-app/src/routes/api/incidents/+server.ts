import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";
import {
  computeSlaBreachAt,
  DEFAULT_SLA_SECONDS,
  type SlaConfig,
} from "@atlasit/shared/incidents/lifecycle";

async function loadSlaConfig(db: D1Database, tenantId: string): Promise<SlaConfig> {
  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'incident_sla_config'",
      )
      .bind(tenantId)
      .first<{ value: string }>();
    if (row?.value) return JSON.parse(row.value);
  } catch {
    /* use defaults */
  }
  return DEFAULT_SLA_SECONDS;
}

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
    const { results } = await db
      .prepare(query)
      .bind(...params)
      .all();
    const items = (results ?? []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      title: row.title,
      severity: row.severity,
      status: row.status,
      source: row.source ?? null,
      sourceId: row.source_id ?? null,
      description: row.description ?? null,
      ownerEmail: row.owner_email ?? null,
      ownerId: row.owner_id ?? null,
      investigatingAt: row.investigating_at ?? null,
      slaBreachAt: row.sla_breach_at ?? null,
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
  const validSeverities = ["low", "medium", "high", "critical"];
  const severity = validSeverities.includes(body.severity) ? body.severity : "medium";
  const description = body.description || "";
  const now = new Date().toISOString();

  // Compute SLA breach deadline from tenant config
  const slaConfig = await loadSlaConfig(db, tenantId);
  const slaBreachAt = computeSlaBreachAt(now, severity, slaConfig);

  try {
    await db
      .prepare(
        `INSERT INTO incidents (id, tenant_id, title, severity, status, source, description, created_at, sla_breach_at)
         VALUES (?, ?, ?, ?, 'open', 'manual', ?, ?, ?)`,
      )
      .bind(id, tenantId, body.title, severity, description, now, slaBreachAt)
      .run();
  } catch (e: any) {
    console.error("Failed to create incident:", e);
    return json({ error: "Failed to create incident" }, { status: 500 });
  }

  // Write initial timeline entry
  try {
    const timelineId = crypto.randomUUID().replace(/-/g, "");
    await db
      .prepare(
        `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
         VALUES (?, ?, ?, 'auto_action', ?, 'Incident created')`,
      )
      .bind(timelineId, id, tenantId, user.email ?? "unknown")
      .run();
  } catch {
    // Non-blocking
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
