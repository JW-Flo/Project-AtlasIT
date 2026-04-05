import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

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

  const ownerEmail = body?.ownerEmail;
  if (!ownerEmail || typeof ownerEmail !== "string") {
    return json({ error: "Missing required field: ownerEmail" }, { status: 400 });
  }

  // Verify incident exists for this tenant
  const incident = await db
    .prepare("SELECT id, owner_email FROM incidents WHERE id = ? AND tenant_id = ?")
    .bind(id, tenantId)
    .first<{ id: string; owner_email: string | null }>();

  if (!incident) {
    return json({ error: "Incident not found" }, { status: 404 });
  }

  // Validate assignee exists in tenant
  const assignee = await db
    .prepare("SELECT email FROM console_user_roles WHERE email = ? AND tenant_id = ?")
    .bind(ownerEmail, tenantId)
    .first<{ email: string }>();

  if (!assignee) {
    return json({ error: "Assignee not found in tenant" }, { status: 422 });
  }

  // Update incident owner
  await db
    .prepare("UPDATE incidents SET owner_email = ? WHERE id = ? AND tenant_id = ?")
    .bind(ownerEmail, id, tenantId)
    .run();

  // Write timeline entry
  const timelineId = crypto.randomUUID().replace(/-/g, "");
  await db
    .prepare(
      `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content, metadata)
       VALUES (?, ?, ?, 'assignment', ?, ?, ?)`,
    )
    .bind(
      timelineId,
      id,
      tenantId,
      user.email ?? "unknown",
      `Assigned to ${ownerEmail}`,
      JSON.stringify({ previousOwner: incident.owner_email ?? null, newOwner: ownerEmail }),
    )
    .run();

  // Audit log
  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "incident.assigned",
      targetType: "incident",
      targetId: id,
      detail: JSON.stringify({ ownerEmail }),
    });
  } catch {
    // Non-blocking
  }

  // Notify the assignee
  try {
    const { notify } = await import("$lib/server/notifications");
    const assigneeUser = await db
      .prepare("SELECT id FROM console_users WHERE email = ? AND tenant_id = ?")
      .bind(ownerEmail, tenantId)
      .first<{ id: string }>();

    await notify(db, platform, {
      tenantId,
      userId: assigneeUser?.id || null,
      type: "incident_assigned",
      title: `Incident assigned to you`,
      body: `You've been assigned to incident ${id} by ${user.email}`,
      severity: "warning",
      sourceType: "incident",
      sourceId: id!,
      sourceLabel: ownerEmail,
      actionUrl: `/console/incidents`,
    });
  } catch {
    // Non-blocking
  }

  return json({ id, ownerEmail });
};
