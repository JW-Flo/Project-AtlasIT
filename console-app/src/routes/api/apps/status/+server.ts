import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listConnectedApps } from "$lib/server/credentials";

export const GET: RequestHandler = async ({ platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required" }, { status: 403 });
  }
  const connected = await listConnectedApps(platform, tenantId);

  const applications = connected.map((c) => ({
    id: c.app_id,
    connected: true,
    connectedAt: c.connected_at,
    lastSync: c.updated_at,
    healthy: c.healthy,
    lastTestAt: c.last_test_at,
  }));

  return new Response(JSON.stringify({ applications }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
