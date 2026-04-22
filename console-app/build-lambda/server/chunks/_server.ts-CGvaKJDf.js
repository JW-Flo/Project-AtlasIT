import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const steps = [];
  steps.push({ name: "login", completed: true, evidence: "authenticated session" });
  const tenant = await db.prepare("SELECT id FROM tenants WHERE id = ? LIMIT 1").bind(tenantId).first();
  steps.push({
    name: "dashboard",
    completed: !!tenant,
    evidence: tenant ? "tenant provisioned" : "no tenant record"
  });
  const connectedApp = await db.prepare(
    "SELECT COUNT(*) as cnt FROM group_app_mappings WHERE tenant_id = ?"
  ).bind(tenantId).first();
  const hasConnectedApp = (connectedApp?.cnt ?? 0) > 0;
  steps.push({
    name: "connect_app",
    completed: hasConnectedApp,
    evidence: hasConnectedApp ? `${connectedApp.cnt} app mapping(s)` : "no app mappings configured"
  });
  const ruleCount = await db.prepare(
    "SELECT COUNT(*) as cnt FROM automation_rules WHERE tenant_id = ?"
  ).bind(tenantId).first();
  const hasRule = (ruleCount?.cnt ?? 0) > 0;
  steps.push({
    name: "create_automation",
    completed: hasRule,
    evidence: hasRule ? `${ruleCount.cnt} automation rule(s)` : "no automation rules"
  });
  const evidenceCount = await db.prepare(
    "SELECT COUNT(*) as cnt FROM compliance_evidence WHERE tenant_id = ?"
  ).bind(tenantId).first();
  const hasEvidence = (evidenceCount?.cnt ?? 0) > 0;
  steps.push({
    name: "see_evidence",
    completed: hasEvidence,
    evidence: hasEvidence ? `${evidenceCount.cnt} evidence item(s)` : "no evidence collected"
  });
  const completedSteps = steps.filter((s) => s.completed).length;
  const completionRate = Math.round(completedSteps / steps.length * 100);
  return json({
    tenantId,
    steps,
    completedSteps,
    totalSteps: steps.length,
    completionRate,
    fullyActivated: completedSteps === steps.length,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
};

export { GET };
//# sourceMappingURL=_server.ts-CGvaKJDf.js.map
