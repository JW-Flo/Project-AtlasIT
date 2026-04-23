import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { deleteCredentials } from "$lib/server/credentials";
import { writeAudit } from "$lib/server/audit";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required" }, { status: 403 });
  }
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const appId = body.appId;
  if (!appId) {
    return new Response(JSON.stringify({ error: "appId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await deleteCredentials(platform, appId, tenantId);

  // Log audit event for successful app disconnection
  try {
    await queryPg(
      `INSERT INTO audit_log (id, tenant_id, actor_id, action, resource_type, resource_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        crypto.randomUUID(),
        tenantId,
        user.userId ?? "unknown",
        "app.disconnected",
        "app",
        appId,
        JSON.stringify({ actorEmail: user.email ?? "unknown" }),
      ],
    );
  } catch {
    // Non-blocking: audit write failure shouldn't break app disconnection
  }

  // Notify about app disconnection
  try {
    const { notify } = await import("$lib/server/notifications");
    await notify(platform, {
      tenantId,
      type: "app_disconnected",
      title: `App disconnected: ${appId}`,
      body: `${appId} was disconnected by ${user.email}`,
      severity: "warning",
      sourceType: "app",
      sourceId: appId,
      sourceLabel: appId,
      actionUrl: `/console/directory`,
    });
  } catch {
    // Non-blocking
  }

  return new Response(JSON.stringify({ success: true, connected: false, id: appId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
