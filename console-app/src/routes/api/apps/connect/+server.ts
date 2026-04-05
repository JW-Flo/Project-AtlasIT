import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { saveCredentials } from "$lib/server/credentials";
import { writeAudit } from "$lib/server/audit";
import { gateAdapterInstall } from "$lib/server/tier-gate";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required" }, { status: 403 });
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (db) {
    const tierGate = await gateAdapterInstall(db, tenantId, !!user.superAdmin);
    if (tierGate) return tierGate;
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

  const credentials: Record<string, string> = body.credentials || {};

  const result = await saveCredentials(platform, appId, credentials, tenantId);

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error || "Failed to save credentials" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fire automation event for app_connected trigger
  if (db) {
    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: user.email ?? "unknown",
        action: "app.connected",
        targetType: "app",
        targetId: appId,
      });
    } catch {
      // Non-blocking: audit write failure shouldn't break connection
    }
  }

  return new Response(JSON.stringify({ success: true, connected: true, id: appId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
