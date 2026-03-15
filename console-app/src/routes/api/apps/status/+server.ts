import type { RequestHandler } from "@sveltejs/kit";
import { listConnectedApps } from "$lib/server/credentials";

export const GET: RequestHandler = async ({ platform }) => {
  const connected = await listConnectedApps(platform);

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
