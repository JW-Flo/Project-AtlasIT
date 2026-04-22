import { json } from '@sveltejs/kit';
import { a as analyzeComplianceGaps } from './gap-analyzer-CVZTZ0l9.js';
import { b as buildAutomationFromNL } from './nl-builder-Cpy3_06C.js';
import './ai-J0pj_lx1.js';

const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const env = platform?.env || {};
  const { queryPg } = await import('./pg-BHX2Ay11.js');
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const prompt = body?.prompt?.trim();
  if (!prompt || prompt.length < 5) {
    return json({ error: "prompt must be at least 5 characters" }, { status: 400 });
  }
  if (prompt.length > 1e3) {
    return json({ error: "prompt must be at most 1000 characters" }, { status: 400 });
  }
  let connectedApps = body.connectedApps;
  let directoryGroups = body.directoryGroups;
  if (!connectedApps) {
    try {
      const rows = await queryPg(
        "SELECT DISTINCT app_name FROM connected_apps WHERE tenant_id = $1 AND status = 'active'",
        [tenantId]
      );
      connectedApps = rows.map((r) => r.app_name);
    } catch {
    }
  }
  if (!directoryGroups) {
    try {
      const rows = await queryPg(
        "SELECT DISTINCT name FROM directory_groups WHERE tenant_id = $1 LIMIT 50",
        [tenantId]
      );
      directoryGroups = rows.map((r) => r.name);
    } catch {
    }
  }
  if (!env.GROQ_API_KEY && !env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    return json(
      {
        error: "AI provider not configured",
        detail: "GROQ_API_KEY secret must be set for the console-app worker. Run: wrangler secret put GROQ_API_KEY --name atlasit-console"
      },
      { status: 503 }
    );
  }
  let complianceGaps;
  let existingRulesSummary;
  try {
    const prefRows = await queryPg(
      "SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'frameworks'",
      [tenantId]
    );
    const prefRow = prefRows[0];
    const frameworks = prefRow?.value ? JSON.parse(prefRow.value) : ["SOC2"];
    const gapResult = await analyzeComplianceGaps(tenantId, frameworks);
    complianceGaps = gapResult.gaps.filter((g) => g.priority === "critical" || g.priority === "high").slice(0, 5);
  } catch {
  }
  try {
    const ruleRows = await queryPg(
      "SELECT name, trigger_type, actions FROM automation_rules WHERE tenant_id = $1 AND enabled = true LIMIT 20",
      [tenantId]
    );
    existingRulesSummary = (ruleRows ?? []).map(
      (r) => `${r.name} (trigger: ${r.trigger_type}, actions: ${r.actions})`
    );
  } catch {
  }
  try {
    const result = await buildAutomationFromNL(env, {
      prompt,
      connectedApps,
      directoryGroups,
      complianceGaps,
      existingRulesSummary
    });
    return json({
      status: "success",
      data: result
    });
  } catch (err) {
    console.error("NL automation build failed:", err?.message);
    return json(
      {
        error: "Failed to build automation from prompt",
        detail: err?.message || "Unknown error"
      },
      { status: 422 }
    );
  }
};

export { POST };
//# sourceMappingURL=_server.ts-cPp_QIS0.js.map
