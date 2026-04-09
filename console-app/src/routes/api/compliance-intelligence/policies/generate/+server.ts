import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { generateSecurityPolicy, diffPolicies } from "@atlasit/shared";
import type { PolicyType, TenantContext } from "@atlasit/shared";

const VALID_POLICY_TYPES: PolicyType[] = [
  "access_control",
  "incident_response",
  "data_handling",
  "password",
  "acceptable_use",
];

/**
 * POST /api/compliance-intelligence/policies/generate
 * Generate a security policy from frameworks + tenant configuration.
 * Body: { policyType: PolicyType, existingPolicyText?: string }
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  let body: { policyType?: string; existingPolicyText?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const policyType = body.policyType as PolicyType;
  if (!policyType || !VALID_POLICY_TYPES.includes(policyType)) {
    return json(
      { error: `policyType must be one of: ${VALID_POLICY_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  // Build tenant context from D1
  const [frameworkRow, appsResult, rulesResult, scoresResult] = await Promise.allSettled([
    db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'")
      .bind(tenantId)
      .first<{ value: string }>(),
    db
      .prepare(
        "SELECT DISTINCT app_name FROM connected_apps WHERE tenant_id = ? AND status = 'active' LIMIT 50",
      )
      .bind(tenantId)
      .all<{ app_name: string }>(),
    db
      .prepare("SELECT COUNT(*) as cnt FROM automation_rules WHERE tenant_id = ? AND enabled = 1")
      .bind(tenantId)
      .first<{ cnt: number }>(),
    db
      .prepare(
        "SELECT framework, score FROM compliance_scores WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10",
      )
      .bind(tenantId)
      .all<{ framework: string; score: number }>(),
  ]);

  const frameworks =
    frameworkRow.status === "fulfilled" && frameworkRow.value?.value
      ? JSON.parse(frameworkRow.value.value)
      : ["SOC2"];

  const connectedApps =
    appsResult.status === "fulfilled"
      ? (appsResult.value.results ?? []).map((r) => r.app_name)
      : [];

  const ruleCount =
    rulesResult.status === "fulfilled" && rulesResult.value?.cnt ? rulesResult.value.cnt : 0;

  const scores: Record<string, number> = {};
  if (scoresResult.status === "fulfilled") {
    for (const row of scoresResult.value.results ?? []) {
      if (!scores[row.framework]) scores[row.framework] = row.score;
    }
  }

  const tenantContext: TenantContext = {
    tenantId,
    tenantName: (user.email?.split("@")[1] ?? "Organization").replace(/\.\w+$/, ""),
    selectedFrameworks: frameworks,
    connectedApps,
    automationRuleCount: ruleCount,
    complianceScores: scores,
    evidenceSummary: `${connectedApps.length} connected apps, ${ruleCount} automation rules`,
  };

  try {
    const policy = await generateSecurityPolicy(env, tenantContext, policyType);

    let diff;
    if (body.existingPolicyText) {
      const generatedText = policy.sections
        .map((s) => `## ${s.title}\n\n${s.content}`)
        .join("\n\n");
      diff = diffPolicies(body.existingPolicyText, generatedText);
    }

    // Record that policies have been generated for this tenant
    try {
      const existing = await db
        .prepare(
          "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'generated_policies'",
        )
        .bind(tenantId)
        .first<{ value: string }>();
      const current: string[] = existing?.value ? JSON.parse(existing.value) : [];
      if (!current.includes(policyType)) current.push(policyType);
      const newValue = JSON.stringify(current);
      await db.batch([
        db
          .prepare("DELETE FROM tenant_preferences WHERE tenant_id = ? AND key = ?")
          .bind(tenantId, "generated_policies"),
        db
          .prepare("INSERT INTO tenant_preferences (tenant_id, key, value) VALUES (?, ?, ?)")
          .bind(tenantId, "generated_policies", newValue),
      ]);
    } catch {
      // Non-fatal: preference write failure should not fail the generation response
    }

    return json({ status: "success", data: { policy, diff } });
  } catch (err: any) {
    console.error("Policy generation failed:", err?.message);
    return json({ error: "Failed to generate policy", detail: err?.message }, { status: 422 });
  }
};
