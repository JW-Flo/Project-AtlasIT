import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { saveCredentials } from "$lib/server/credentials";
import { writeAudit } from "$lib/server/audit";
import { gateAdapterInstall } from "$lib/server/tier-gate";
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

  const tierGate = await gateAdapterInstall(tenantId, !!user.superAdmin);
  if (tierGate) return tierGate;

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

  const credentials: Record<string, string> = body.credentials || {};

  const result = await saveCredentials(platform, appId, credentials, tenantId);

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error || "Failed to save credentials" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fire automation event for app_connected trigger
  try {
    await queryPg(
      `INSERT INTO audit_log (id, tenant_id, actor_id, action, resource_type, resource_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        crypto.randomUUID(),
        tenantId,
        user.userId ?? "unknown",
        "app.connected",
        "app",
        appId,
        JSON.stringify({ actorEmail: user.email ?? "unknown" }),
      ],
    );
  } catch {
    // Non-blocking: audit write failure shouldn't break connection
  }

  // Notify about app connection
  try {
    const { notify } = await import("$lib/server/notifications");
    await notify(platform, {
      tenantId,
      type: "app_connected",
      title: `App connected: ${appId}`,
      body: `${appId} was connected by ${user.email}`,
      severity: "info",
      sourceType: "app",
      sourceId: appId,
      sourceLabel: appId,
      actionUrl: `/console/directory`,
    });
  } catch {
    // Non-blocking
  }

  return new Response(JSON.stringify({ success: true, connected: true, id: appId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
