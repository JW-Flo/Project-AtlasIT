import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { deleteCredentials } from "$lib/server/credentials";
import { writeAudit } from "$lib/server/audit";

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
  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (db) {
    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: user.email ?? "unknown",
        action: "app.disconnected",
        targetType: "app",
        targetId: appId,
      });
    } catch {
      // Non-blocking: audit write failure shouldn't break app disconnection
    }
  }

  // Notify about app disconnection
  if (db) {
    try {
      const { notify } = await import("$lib/server/notifications");
      await notify(db, platform, {
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
  }

  return new Response(JSON.stringify({ success: true, connected: false, id: appId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
