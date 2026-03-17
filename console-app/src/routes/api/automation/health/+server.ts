import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  getLatestHealthChecks,
  getHealthHistory,
  recordHealthCheck,
} from "$lib/server/automation";
import { listConnectedApps, updateTestStatus } from "$lib/server/credentials";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ checks: [] });

  const appId = url.searchParams.get("appId");

  if (appId) {
    const history = await getHealthHistory(db, tenantId, appId);
    return json({ history });
  }

  const checks = await getLatestHealthChecks(db, tenantId);
  return json({ checks });
};

/** Trigger health checks for all connected apps */
export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const connectedApps = await listConnectedApps(platform, tenantId);
  const results = [];

  for (const app of connectedApps) {
    const start = Date.now();
    // Simulate health check — in production this calls the adapter's health endpoint
    const healthy = app.healthy;
    const responseMs = Date.now() - start;

    await recordHealthCheck(db, tenantId, {
      appId: app.app_id,
      healthy,
      responseMs,
      details: {
        lastSync: app.updated_at,
        lastTestAt: app.last_test_at,
      },
    });

    results.push({
      appId: app.app_id,
      healthy,
      responseMs,
    });
  }

  return json({ results, checkedAt: new Date().toISOString() });
};
