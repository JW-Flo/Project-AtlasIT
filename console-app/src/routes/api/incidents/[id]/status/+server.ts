import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";
import { validateStatusTransition } from "@atlasit/shared/incidents/lifecycle";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

export const PUT: RequestHandler = async ({ params, request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin", "member"]);
  if (guard) return guard;

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const { id } = params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newStatus = body?.status;
  if (!newStatus || typeof newStatus !== "string") {
    return json({ error: "Missing required field: status" }, { status: 400 });
  }

  // Load current incident
  const incident = await db
    .prepare("SELECT id, status FROM incidents WHERE id = ? AND tenant_id = ?")
    .bind(id, tenantId)
    .first<{ id: string; status: string }>();

  if (!incident) {
    return json({ error: "Incident not found" }, { status: 404 });
  }

  if (!validateStatusTransition(incident.status, newStatus)) {
    return json(
      { error: `Invalid transition: ${incident.status} → ${newStatus}` },
      { status: 422 },
    );
  }

  const now = new Date().toISOString();

  // Build UPDATE query based on target status
  if (newStatus === "investigating") {
    await db
      .prepare("UPDATE incidents SET status = 'investigating', investigating_at = ? WHERE id = ? AND tenant_id = ?")
      .bind(now, id, tenantId)
      .run();
  } else if (newStatus === "resolved") {
    await db
      .prepare("UPDATE incidents SET status = 'resolved', resolved_at = ? WHERE id = ? AND tenant_id = ?")
      .bind(now, id, tenantId)
      .run();
  }

  // Write timeline entry
  const timelineId = crypto.randomUUID().replace(/-/g, "");
  await db
    .prepare(
      `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content, metadata)
       VALUES (?, ?, ?, 'status_change', ?, ?, ?)`,
    )
    .bind(
      timelineId,
      id,
      tenantId,
      user.email ?? "unknown",
      body.comment || `Status changed to ${newStatus}`,
      JSON.stringify({ oldStatus: incident.status, newStatus }),
    )
    .run();

  // Audit log
  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: `incident.${newStatus}`,
      targetType: "incident",
      targetId: id,
      detail: JSON.stringify({ oldStatus: incident.status, newStatus }),
    });
  } catch {
    // Non-blocking
  }

  return json({ id, status: newStatus, updatedAt: now });
};
