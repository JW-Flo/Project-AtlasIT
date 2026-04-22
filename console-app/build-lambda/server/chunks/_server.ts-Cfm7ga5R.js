import { json } from '@sveltejs/kit';
import './gap-analyzer-CVZTZ0l9.js';

function parseActions(resultsJson) {
  try {
    const parsed = JSON.parse(resultsJson);
    return parsed.actions ?? [];
  } catch {
    return [];
  }
}
function parseUserEmail(triggerEventJson) {
  try {
    const parsed = JSON.parse(triggerEventJson);
    return parsed.payload?.user?.email ?? parsed.payload?.email ?? "unknown";
  } catch {
    return "unknown";
  }
}
async function detectRiskAnomalies(db, tenantId, options = {}) {
  const { businessHoursStart = 6, businessHoursEnd = 20, bulkProvisionThreshold = 5, bulkRevocationThreshold = 10 } = options;
  const { results: executions } = await db.prepare(`SELECT id, rule_id, status, results, trigger_event, created_at
       FROM automation_executions
       WHERE tenant_id = ? AND created_at > datetime('now', '-24 hours')
       ORDER BY created_at DESC
       LIMIT 500`).bind(tenantId).all();
  if (!executions?.length)
    return [];
  const typedExecutions = executions;
  const anomalies = [];
  const oneHourAgo = Date.now() - 60 * 60 * 1e3;
  const recentProvisions = [];
  const recentRevocations = [];
  const offHoursProvisions = [];
  for (const exec of typedExecutions) {
    const actions = parseActions(exec.results);
    const email = parseUserEmail(exec.trigger_event);
    const execTime = new Date(exec.created_at).getTime();
    const execHour = new Date(exec.created_at).getUTCHours();
    for (const action of actions) {
      const appId = action.config?.appId ?? "unknown";
      if (action.type === "provision_app_access" || action.type === "assign_role") {
        if (execTime > oneHourAgo) {
          recentProvisions.push({ email, appId, at: exec.created_at });
        }
        if (execHour < businessHoursStart || execHour >= businessHoursEnd) {
          offHoursProvisions.push({ email, appId, at: exec.created_at });
        }
      }
      if (action.type === "revoke_app_access" || action.type === "remove_role") {
        if (execTime > oneHourAgo) {
          recentRevocations.push({ email, appId, at: exec.created_at });
        }
      }
    }
  }
  if (recentProvisions.length > bulkProvisionThreshold) {
    const affectedUsers = [...new Set(recentProvisions.map((p) => p.email))];
    const affectedApps = [...new Set(recentProvisions.map((p) => p.appId))];
    anomalies.push({
      anomalyType: "bulk_privilege_escalation",
      severity: recentProvisions.length > bulkProvisionThreshold * 2 ? "critical" : "high",
      description: `${recentProvisions.length} access grants detected in the last hour across ${affectedApps.length} app(s) for ${affectedUsers.length} user(s). This may indicate unauthorized bulk provisioning`,
      affectedUsers,
      affectedApps,
      detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
      evidence: {
        provisionCount: recentProvisions.length,
        threshold: bulkProvisionThreshold,
        windowHours: 1
      }
    });
  }
  if (recentRevocations.length > bulkRevocationThreshold) {
    const affectedUsers = [...new Set(recentRevocations.map((r) => r.email))];
    const affectedApps = [...new Set(recentRevocations.map((r) => r.appId))];
    anomalies.push({
      anomalyType: "unusual_revocation_volume",
      severity: recentRevocations.length > bulkRevocationThreshold * 2 ? "critical" : "high",
      description: `${recentRevocations.length} access revocations in the last hour across ${affectedApps.length} app(s). This could indicate a breach response or misconfigured automation rule`,
      affectedUsers,
      affectedApps,
      detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
      evidence: {
        revocationCount: recentRevocations.length,
        threshold: bulkRevocationThreshold,
        windowHours: 1
      }
    });
  }
  if (offHoursProvisions.length > 0) {
    const affectedUsers = [...new Set(offHoursProvisions.map((p) => p.email))];
    const affectedApps = [...new Set(offHoursProvisions.map((p) => p.appId))];
    anomalies.push({
      anomalyType: "off_hours_provisioning",
      severity: offHoursProvisions.length > 3 ? "high" : "medium",
      description: `${offHoursProvisions.length} access change(s) detected outside business hours (${businessHoursStart}:00-${businessHoursEnd}:00 UTC). Review for unauthorized activity`,
      affectedUsers,
      affectedApps,
      detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
      evidence: {
        offHoursCount: offHoursProvisions.length,
        businessHours: `${businessHoursStart}:00-${businessHoursEnd}:00 UTC`,
        events: offHoursProvisions.slice(0, 10)
      }
    });
  }
  return anomalies;
}
const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: "Authentication required. Please sign in again." }, { status: 401 });
  }
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required. Contact your administrator." }, { status: 403 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) {
    return json({ error: "Database unavailable. Please try again in a moment." }, { status: 503 });
  }
  try {
    const anomalies = await detectRiskAnomalies(db, tenantId);
    return json({ tenantId, anomalies, detectedAt: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Anomaly detection failed",
        tenantId,
        error: String(err)
      })
    );
    return json(
      {
        error: "Failed to detect anomalies. Please try again.",
        tenantId,
        anomalies: [],
        detectedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      { status: 500 }
    );
  }
};

export { GET };
//# sourceMappingURL=_server.ts-Cfm7ga5R.js.map
