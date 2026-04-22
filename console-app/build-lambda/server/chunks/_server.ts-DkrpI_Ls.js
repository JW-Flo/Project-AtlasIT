import { json } from '@sveltejs/kit';
import { g as getHealthHistory, a as getLatestHealthChecks, b as recordHealthCheck } from './automation-pg-BL11rGe-.js';
import { l as listConnectedApps, u as updateTestStatus } from './credentials-CkBYNzQv.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const GET = async ({ url, locals }) => {
  const user = locals.user;
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
const POST = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const connectedApps = await listConnectedApps(platform, tenantId);
  const env = platform?.env || {};
  let adapterUrls = {};
  try {
    adapterUrls = JSON.parse(env.ADAPTER_URLS || "{}");
  } catch {
  }
  const results = [];
  for (const app of connectedApps) {
    const start = Date.now();
    let healthy = false;
    let details = { lastSync: app.updated_at };
    const adapterUrl = adapterUrls[app.app_id];
    if (adapterUrl) {
      try {
        const res = await fetch(`${adapterUrl}/health`, {
          signal: AbortSignal.timeout(5e3)
        });
        healthy = res.ok;
        details.adapterStatus = res.status;
      } catch (e) {
        healthy = false;
        details.error = e?.message || "Adapter unreachable";
      }
    } else {
      healthy = true;
      details.note = "No adapter URL configured; assumed healthy";
    }
    const responseMs = Date.now() - start;
    await recordHealthCheck(tenantId, {
      appId: app.app_id,
      healthy,
      responseMs,
      details
    });
    await updateTestStatus(platform, app.app_id, healthy, tenantId);
    results.push({
      appId: app.app_id,
      healthy,
      responseMs
    });
  }
  return json({ results, checkedAt: (/* @__PURE__ */ new Date()).toISOString() });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-DkrpI_Ls.js.map
