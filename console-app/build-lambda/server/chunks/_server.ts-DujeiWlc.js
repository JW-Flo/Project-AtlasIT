import { json } from '@sveltejs/kit';
import './gap-analyzer-CVZTZ0l9.js';
import { g as generateSecurityPolicy } from './policy-generator-Dl0WlVu2.js';
import './ai-J0pj_lx1.js';

function diffPolicies(existingText, generatedText) {
  const existingLines = existingText.split("\n");
  const generatedLines = generatedText.split("\n");
  const m = existingLines.length;
  const n = generatedLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i2 = 1; i2 <= m; i2++) {
    for (let j2 = 1; j2 <= n; j2++) {
      if (existingLines[i2 - 1] === generatedLines[j2 - 1]) {
        dp[i2][j2] = dp[i2 - 1][j2 - 1] + 1;
      } else {
        dp[i2][j2] = Math.max(dp[i2 - 1][j2], dp[i2][j2 - 1]);
      }
    }
  }
  const result = [];
  let i = m;
  let j = n;
  const temp = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && existingLines[i - 1] === generatedLines[j - 1]) {
      temp.push({ lineNumber: 0, type: "unchanged", content: existingLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ lineNumber: 0, type: "added", content: generatedLines[j - 1] });
      j--;
    } else {
      temp.push({ lineNumber: 0, type: "removed", content: existingLines[i - 1] });
      i--;
    }
  }
  temp.reverse();
  for (let k = 0; k < temp.length; k++) {
    result.push({ ...temp[k], lineNumber: k + 1 });
  }
  return result;
}
const VALID_POLICY_TYPES = [
  "access_control",
  "incident_response",
  "data_handling",
  "password",
  "acceptable_use"
];
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const policyType = body.policyType;
  if (!policyType || !VALID_POLICY_TYPES.includes(policyType)) {
    return json(
      { error: `policyType must be one of: ${VALID_POLICY_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  const [frameworkRow, appsResult, rulesResult, scoresResult] = await Promise.allSettled([
    db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'").bind(tenantId).first(),
    db.prepare(
      "SELECT DISTINCT app_name FROM connected_apps WHERE tenant_id = ? AND status = 'active' LIMIT 50"
    ).bind(tenantId).all(),
    db.prepare("SELECT COUNT(*) as cnt FROM automation_rules WHERE tenant_id = ? AND enabled = 1").bind(tenantId).first(),
    db.prepare(
      "SELECT framework, score FROM compliance_scores WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10"
    ).bind(tenantId).all()
  ]);
  const frameworks = frameworkRow.status === "fulfilled" && frameworkRow.value?.value ? JSON.parse(frameworkRow.value.value) : ["SOC2"];
  const connectedApps = appsResult.status === "fulfilled" ? (appsResult.value.results ?? []).map((r) => r.app_name) : [];
  const ruleCount = rulesResult.status === "fulfilled" && rulesResult.value?.cnt ? rulesResult.value.cnt : 0;
  const scores = {};
  if (scoresResult.status === "fulfilled") {
    for (const row of scoresResult.value.results ?? []) {
      if (!scores[row.framework]) scores[row.framework] = row.score;
    }
  }
  const tenantContext = {
    tenantId,
    tenantName: (user.email?.split("@")[1] ?? "Organization").replace(/\.\w+$/, ""),
    selectedFrameworks: frameworks,
    connectedApps,
    automationRuleCount: ruleCount,
    complianceScores: scores,
    evidenceSummary: `${connectedApps.length} connected apps, ${ruleCount} automation rules`
  };
  try {
    const policy = await generateSecurityPolicy(env, tenantContext, policyType);
    let diff;
    if (body.existingPolicyText) {
      const generatedText = policy.sections.map((s) => `## ${s.title}

${s.content}`).join("\n\n");
      diff = diffPolicies(body.existingPolicyText, generatedText);
    }
    try {
      const existing = await db.prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'generated_policies'"
      ).bind(tenantId).first();
      const current = existing?.value ? JSON.parse(existing.value) : [];
      if (!current.includes(policyType)) current.push(policyType);
      const newValue = JSON.stringify(current);
      await db.batch([
        db.prepare("DELETE FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(tenantId, "generated_policies"),
        db.prepare("INSERT INTO tenant_preferences (tenant_id, key, value) VALUES (?, ?, ?)").bind(tenantId, "generated_policies", newValue)
      ]);
    } catch {
    }
    return json({ status: "success", data: { policy, diff } });
  } catch (err) {
    console.error("Policy generation failed:", err?.message);
    return json({ error: "Failed to generate policy", detail: err?.message }, { status: 422 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-DujeiWlc.js.map
