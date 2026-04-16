import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  getLatestHealthChecks,
  getHealthHistory,
  recordHealthCheck,
} from "$lib/server/automation-pg";
import { listConnectedApps, updateTestStatus } from "$lib/server/credentials";

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const appId = url.searchParams.get("appId");

  if (appId) {
    const history = await getHealthHistory(tenantId, appId);
    return json({ history });
  }

  const checks = await getLatestHealthChecks(tenantId);
  return json({ checks });
};

/** Trigger health checks for all connected apps */
export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const connectedApps = await listConnectedApps(platform, tenantId);
  const env = (platform?.env as any) || {};
  let adapterUrls: Record<string, string> = {};
  try {
    adapterUrls = JSON.parse(env.ADAPTER_URLS || "{}");
  } catch {
    /* fall through */
  }

  const results = [];

  for (const app of connectedApps) {
    const start = Date.now();
    let healthy = false;
    let details: Record<string, unknown> = { lastSync: app.updated_at };

    // Attempt to ping the adapter's health endpoint
    const adapterUrl = adapterUrls[app.app_id];
    if (adapterUrl) {
      try {
        const res = await fetch(`${adapterUrl}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        healthy = res.ok;
        details.adapterStatus = res.status;
      } catch (e: any) {
        healthy = false;
        details.error = e?.message || "Adapter unreachable";
      }
    } else {
      // No adapter URL configured — assume healthy if previously connected
      healthy = true;
      details.note = "No adapter URL configured; assumed healthy";
    }

    const responseMs = Date.now() - start;

    await recordHealthCheck(tenantId, {
      appId: app.app_id,
      healthy,
      responseMs,
      details,
    });

    // Update the app_credentials healthy flag
    await updateTestStatus(platform, app.app_id, healthy, tenantId);

    results.push({
      appId: app.app_id,
      healthy,
      responseMs,
    });
  }

  return json({ results, checkedAt: new Date().toISOString() });
};
