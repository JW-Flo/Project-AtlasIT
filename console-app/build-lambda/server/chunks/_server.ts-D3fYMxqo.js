import { g as getWorkerBase, a as getEnv, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';
import './gap-analyzer-CVZTZ0l9.js';
import { g as generateSecurityPolicy } from './policy-generator-Dl0WlVu2.js';
import './ai-J0pj_lx1.js';

const POLICY_TYPE_FALLBACKS = {
  "soc2.demo": "access_control",
  "soc2.access_control": "access_control",
  "iso27001.isms": "access_control",
  "nist.csf": "access_control",
  "hipaa.security": "data_handling",
  "dataprotection.general": "data_handling",
  access_control: "access_control",
  incident_response: "incident_response",
  data_handling: "data_handling",
  password: "password",
  acceptable_use: "acceptable_use"
};
async function writeGeneratedPoliciesPreference(db, tenantId, policyKey) {
  try {
    const existing = await db.prepare(
      "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'generated_policies'"
    ).bind(tenantId).first();
    const current = existing?.value ? JSON.parse(existing.value) : [];
    if (!current.includes(policyKey)) current.push(policyKey);
    const newValue = JSON.stringify(current);
    await db.batch([
      db.prepare("DELETE FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(tenantId, "generated_policies"),
      db.prepare("INSERT INTO tenant_preferences (tenant_id, key, value) VALUES (?, ?, ?)").bind(tenantId, "generated_policies", newValue)
    ]);
  } catch {
  }
}
async function buildTenantContext(db, tenantId, user) {
  let tenantName = "Organization";
  let industry = "";
  let connectedApps = [];
  let frameworks = [];
  let automationRuleCount = 0;
  let complianceScores = {};
  let userCount = 0;
  if (!db) {
    return {
      tenantName,
      connectedApps,
      selectedFrameworks: ["SOC2"],
      automationRuleCount: 0,
      complianceScores: {},
      evidenceSummary: "No evidence data available.",
      userCount: 0,
      industry: "",
      contactEmail: user.email || ""
    };
  }
  try {
    const [tenantRow, appsResult, fwResult, rulesResult, scoresResult, usersResult] = await Promise.all([
      db.prepare("SELECT name, industry FROM tenants WHERE id = ?").bind(tenantId).first(),
      db.prepare("SELECT app_id FROM app_credentials WHERE tenant_id = ?").bind(tenantId).all(),
      db.prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'"
      ).bind(tenantId).first(),
      db.prepare(
        "SELECT COUNT(*) as cnt FROM tenant_preferences WHERE tenant_id = ? AND key = 'automation_rules'"
      ).bind(tenantId).first().catch(() => null),
      db.prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_scores'"
      ).bind(tenantId).first().catch(() => null),
      db.prepare("SELECT COUNT(*) as cnt FROM users WHERE tenant_id = ?").bind(tenantId).first().catch(() => null)
    ]);
    if (tenantRow?.name) tenantName = tenantRow.name;
    if (tenantRow?.industry) industry = tenantRow.industry;
    connectedApps = (appsResult?.results || []).map((r) => r.app_id);
    if (fwResult?.value) {
      try {
        frameworks = JSON.parse(fwResult.value);
      } catch {
      }
    }
    automationRuleCount = rulesResult?.cnt ?? 0;
    if (scoresResult?.value) {
      try {
        complianceScores = JSON.parse(scoresResult.value);
      } catch {
      }
    }
    userCount = usersResult?.cnt ?? 0;
  } catch {
  }
  const evidenceParts = [];
  if (connectedApps.length > 0)
    evidenceParts.push(`${connectedApps.length} integrated application(s)`);
  if (userCount > 0) evidenceParts.push(`${userCount} directory user(s)`);
  if (automationRuleCount > 0) evidenceParts.push(`${automationRuleCount} automation rule(s)`);
  const evidenceSummary = evidenceParts.length > 0 ? `Active evidence sources: ${evidenceParts.join(", ")}.` : "Evidence collection is being configured.";
  return {
    tenantName,
    connectedApps,
    selectedFrameworks: frameworks.length > 0 ? frameworks : ["SOC2"],
    automationRuleCount,
    complianceScores,
    evidenceSummary,
    userCount,
    industry,
    contactEmail: user.email || ""
  };
}
const POST = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const templateKey = body?.templateKey;
  if (!templateKey || typeof templateKey !== "string") {
    return new Response(JSON.stringify({ error: "templateKey required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  try {
    const upstream = `${base}/api/v1/policies/generate`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY || "",
        "x-tenant-id": tenantId
      },
      body: JSON.stringify({
        templateKey,
        input: body.input || {}
      })
    });
    if (res.ok) {
      const data = await res.json();
      const policy = data?.data?.policy ?? data;
      if (!policy.content && policy.sections && Array.isArray(policy.sections)) {
        policy.content = policy.sections.map((s) => `## ${s.title}

${s.content}`).join("\n\n");
        policy.sizeBytes = new TextEncoder().encode(policy.content).byteLength;
      }
      if (db) await writeGeneratedPoliciesPreference(db, tenantId, templateKey);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch {
  }
  const policyType = POLICY_TYPE_FALLBACKS[templateKey] || "access_control";
  try {
    const ctx = await buildTenantContext(db, tenantId, user);
    const tenantContext = {
      tenantId,
      tenantName: ctx.tenantName,
      connectedApps: ctx.connectedApps,
      selectedFrameworks: ctx.selectedFrameworks,
      automationRuleCount: ctx.automationRuleCount,
      complianceScores: ctx.complianceScores,
      evidenceSummary: ctx.evidenceSummary
    };
    const policy = await generateSecurityPolicy(env, tenantContext, policyType);
    if (db) await writeGeneratedPoliciesPreference(db, tenantId, templateKey);
    const content = policy.sections.map((s) => `## ${s.title}

${s.content}`).join("\n\n");
    const sizeBytes = new TextEncoder().encode(content).byteLength;
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          policy: {
            ...policy,
            content,
            sizeBytes,
            templateKey,
            hash: "",
            reused: false
          },
          source: "local"
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Policy generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-D3fYMxqo.js.map
