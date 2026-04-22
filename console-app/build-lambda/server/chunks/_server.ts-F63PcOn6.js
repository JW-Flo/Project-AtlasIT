import { json } from '@sveltejs/kit';
import { F as FRAMEWORK_CONTROLS } from './framework-controls-w9ucJmdS.js';

async function evaluateTenantState(db, tenantId) {
  const flags = {
    directory_connected: false,
    apps_connected: false,
    incidents_configured: false,
    policies_generated: false,
    workflows_configured: false
  };
  let connectedAppCount = 0;
  let connectedApps = [];
  let directoryUserCount = 0;
  let automationRuleCount = 0;
  const evidenceByControl = {};
  let totalEvidenceCount = 0;
  const results = await Promise.allSettled([
    // Check directory connection
    db.prepare(
      "SELECT status FROM directory_connections WHERE tenant_id = ? AND status = 'active' LIMIT 1"
    ).bind(tenantId).first(),
    // Check connected apps (with IDs)
    db.prepare("SELECT app_id FROM app_credentials WHERE tenant_id = ?").bind(tenantId).all(),
    // Check incidents — configured means incidents exist OR automation rules create them
    db.prepare(
      `SELECT (
           (SELECT COUNT(*) FROM incidents WHERE tenant_id = ?) +
           (SELECT COUNT(*) FROM automation_rules WHERE tenant_id = ? AND actions LIKE '%create_incident%')
         ) as count`
    ).bind(tenantId, tenantId).first(),
    // Check policies
    db.prepare(
      "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'generated_policies'"
    ).bind(tenantId).first(),
    // Check workflows (via automation_rules — workflows table does not exist)
    db.prepare("SELECT COUNT(*) as count FROM automation_rules WHERE tenant_id = ?").bind(tenantId).first(),
    // Check directory user count
    db.prepare("SELECT COUNT(*) as count FROM directory_users WHERE tenant_id = ?").bind(tenantId).first(),
    // Check automation rules
    db.prepare("SELECT COUNT(*) as count FROM automation_rules WHERE tenant_id = ? AND enabled = 1").bind(tenantId).first(),
    // Check evidence per control
    db.prepare(
      "SELECT control_id, COUNT(*) as count FROM compliance_evidence WHERE tenant_id = ? GROUP BY control_id"
    ).bind(tenantId).all()
  ]);
  if (results[0].status === "fulfilled") flags.directory_connected = !!results[0].value;
  if (results[1].status === "fulfilled") {
    const rows = results[1].value?.results || [];
    connectedApps = rows.map((r) => r.app_id);
    connectedAppCount = connectedApps.length;
    flags.apps_connected = connectedAppCount > 0;
  }
  if (results[2].status === "fulfilled") {
    flags.incidents_configured = (results[2].value?.count || 0) > 0;
  }
  if (results[3].status === "fulfilled" && results[3].value?.value) {
    try {
      const policies = JSON.parse(results[3].value.value);
      flags.policies_generated = Array.isArray(policies) && policies.length > 0;
    } catch {
    }
  }
  if (results[4].status === "fulfilled") {
    flags.workflows_configured = (results[4].value?.count || 0) > 0;
  }
  if (results[5].status === "fulfilled") {
    directoryUserCount = results[5].value?.count || 0;
  }
  if (results[6].status === "fulfilled") {
    automationRuleCount = results[6].value?.count || 0;
  }
  if (results[7].status === "fulfilled") {
    const rows = results[7].value?.results || [];
    for (const row of rows) {
      evidenceByControl[row.control_id] = row.count;
      totalEvidenceCount += row.count;
    }
  }
  return {
    flags,
    connectedAppCount,
    connectedApps,
    directoryUserCount,
    automationRuleCount,
    evidenceByControl,
    totalEvidenceCount
  };
}
const POST = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "No tenant" }, { status: 400 });
  let frameworks = [];
  try {
    const row = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'").bind(tenantId).first();
    if (row?.value) frameworks = JSON.parse(row.value);
  } catch {
  }
  if (frameworks.length === 0) frameworks = ["SOC2", "ISO27001", "NIST CSF"];
  const frameworkSet = new Set(frameworks);
  let controls = [];
  let allStoredControls = [];
  try {
    const row = await db.prepare(
      "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'"
    ).bind(tenantId).first();
    if (row?.value) {
      allStoredControls = JSON.parse(row.value);
      controls = allStoredControls.filter((c) => frameworkSet.has(c.framework));
    }
  } catch {
  }
  const tenantState = await evaluateTenantState(db, tenantId);
  const results = [];
  const statusUpdates = /* @__PURE__ */ new Map();
  const controlIdNormalizers = {};
  for (const control of controls) {
    const defs = FRAMEWORK_CONTROLS[control.framework];
    if (!defs) continue;
    const def = defs.find(
      (d) => `${control.framework.toLowerCase().replace(/\s+/g, "_")}_${d.name.toLowerCase().replace(/\s+/g, "_")}` === control.id
    );
    const evidenceKeys = [control.id];
    if (def) {
      evidenceKeys.push(def.name);
    }
    controlIdNormalizers[control.id] = evidenceKeys;
    let evidenceCount = 0;
    for (const key of evidenceKeys) {
      evidenceCount += tenantState.evidenceByControl[key] || 0;
    }
    evidenceCount += tenantState.evidenceByControl["MANUAL"] || 0;
    const flagMet = def?.evaluationKey ? tenantState.flags[def.evaluationKey] ?? false : false;
    const hasEvidence = evidenceCount > 0;
    if (flagMet && hasEvidence && (control.status === "not_started" || control.status === "in_progress")) {
      statusUpdates.set(control.id, "implemented");
      results.push({
        controlId: control.id,
        suggestedStatus: "implemented",
        reason: `Configuration verified (${def?.evaluationKey?.replace(/_/g, " ")}) with ${evidenceCount} evidence item(s)`,
        autoApplied: true
      });
    } else if (flagMet && control.status === "not_started") {
      statusUpdates.set(control.id, "in_progress");
      results.push({
        controlId: control.id,
        suggestedStatus: "in_progress",
        reason: `Tenant has ${def?.evaluationKey?.replace(/_/g, " ")}`,
        autoApplied: true
      });
    } else if (hasEvidence && control.status === "not_started") {
      statusUpdates.set(control.id, "in_progress");
      results.push({
        controlId: control.id,
        suggestedStatus: "in_progress",
        reason: `${evidenceCount} evidence item(s) collected for this control`,
        autoApplied: true
      });
    } else if (!flagMet && !hasEvidence && control.status === "not_started") {
      results.push({
        controlId: control.id,
        suggestedStatus: "not_started",
        reason: def?.evaluationKey ? `${def.evaluationKey.replace(/_/g, " ")} not yet configured; no evidence collected` : "No evidence collected",
        autoApplied: false
      });
    }
  }
  const updated = statusUpdates.size > 0;
  if (updated) {
    const updatedScopedMap = new Map(
      controls.map((c) => {
        const newStatus = statusUpdates.get(c.id);
        return [c.id, newStatus ? { ...c, status: newStatus } : c];
      })
    );
    const mergedControls = allStoredControls.map((c) => updatedScopedMap.get(c.id) ?? c);
    await db.prepare(
      `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
         VALUES (?, 'compliance_controls', ?)`
    ).bind(tenantId, JSON.stringify(mergedControls)).run();
  }
  return json({
    success: true,
    tenantState: {
      ...tenantState.flags,
      connectedAppCount: tenantState.connectedAppCount,
      connectedApps: tenantState.connectedApps,
      directoryUserCount: tenantState.directoryUserCount,
      automationRuleCount: tenantState.automationRuleCount,
      totalEvidenceCount: tenantState.totalEvidenceCount
    },
    evaluations: results,
    controlsUpdated: updated,
    frameworks
  });
};

export { POST };
//# sourceMappingURL=_server.ts-F63PcOn6.js.map
