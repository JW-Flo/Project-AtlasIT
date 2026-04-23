import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../_proxy-helpers";
import { generateSecurityPolicy } from "@atlasit/shared";
import type { PolicyType } from "@atlasit/shared";
import { queryPg, queryPgOne } from "$lib/server/pg";

const POLICY_TYPE_FALLBACKS: Record<string, PolicyType> = {
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
  acceptable_use: "acceptable_use",
};

async function writeGeneratedPoliciesPreference(
  tenantId: string,
  policyKey: string,
): Promise<void> {
  try {
    const existing = await queryPgOne<{ value: string }>(
      `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'generated_policies'`,
      [tenantId],
    );
    const current: string[] = existing?.value ? JSON.parse(existing.value) : [];
    if (!current.includes(policyKey)) current.push(policyKey);
    const newValue = JSON.stringify(current);
    await queryPg(
      `DELETE FROM tenant_preferences WHERE tenant_id = $1 AND key = 'generated_policies'`,
      [tenantId],
    );
    await queryPg(`INSERT INTO tenant_preferences (tenant_id, key, value) VALUES ($1, $2, $3)`, [
      tenantId,
      "generated_policies",
      newValue,
    ]);
  } catch {
    // Non-fatal
  }
}

/** Query PostgreSQL for real tenant data to populate the policy context. */
async function buildTenantContext(
  tenantId: string,
  user: any,
): Promise<{
  tenantName: string;
  connectedApps: string[];
  selectedFrameworks: string[];
  automationRuleCount: number;
  complianceScores: Record<string, number>;
  evidenceSummary: string;
  userCount: number;
  industry: string;
  contactEmail: string;
}> {
  let tenantName = "Organization";
  let industry = "";
  let connectedApps: string[] = [];
  let frameworks: string[] = [];
  let automationRuleCount = 0;
  let complianceScores: Record<string, number> = {};
  let userCount = 0;

  try {
    // Parallel queries for all tenant data
    const [tenantRow, appsRows, fwResult, rulesResult, scoresResult, usersResult] =
      await Promise.all([
        queryPgOne<{ name: string; industry: string }>(
          `SELECT name, industry FROM tenants WHERE id = $1`,
          [tenantId],
        ),
        queryPg<{ app_id: string }>(`SELECT app_id FROM app_credentials WHERE tenant_id = $1`, [
          tenantId,
        ]),
        queryPgOne<{ value: string }>(
          `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'frameworks'`,
          [tenantId],
        ),
        queryPgOne<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM tenant_preferences WHERE tenant_id = $1 AND key = 'automation_rules'`,
          [tenantId],
        ).catch(() => null),
        queryPgOne<{ value: string }>(
          `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'compliance_scores'`,
          [tenantId],
        ).catch(() => null),
        queryPgOne<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM users WHERE tenant_id = $1`, [
          tenantId,
        ]).catch(() => null),
      ]);

    if (tenantRow?.name) tenantName = tenantRow.name;
    if (tenantRow?.industry) industry = tenantRow.industry;
    connectedApps = appsRows.map((r) => r.app_id);
    if (fwResult?.value) {
      try {
        frameworks = JSON.parse(fwResult.value);
      } catch {}
    }
    automationRuleCount = rulesResult?.cnt ?? 0;
    if (scoresResult?.value) {
      try {
        complianceScores = JSON.parse(scoresResult.value);
      } catch {}
    }
    userCount = usersResult?.cnt ?? 0;
  } catch {
    /* use defaults */
  }

  // Build a meaningful evidence summary from real data
  const evidenceParts: string[] = [];
  if (connectedApps.length > 0)
    evidenceParts.push(`${connectedApps.length} integrated application(s)`);
  if (userCount > 0) evidenceParts.push(`${userCount} directory user(s)`);
  if (automationRuleCount > 0) evidenceParts.push(`${automationRuleCount} automation rule(s)`);
  const evidenceSummary =
    evidenceParts.length > 0
      ? `Active evidence sources: ${evidenceParts.join(", ")}.`
      : "Evidence collection is being configured.";

  return {
    tenantName,
    connectedApps,
    selectedFrameworks: frameworks.length > 0 ? frameworks : ["SOC2"],
    automationRuleCount,
    complianceScores,
    evidenceSummary,
    userCount,
    industry,
    contactEmail: user.email || "",
  };
}

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const templateKey = body?.templateKey;
  if (!templateKey || typeof templateKey !== "string") {
    return new Response(JSON.stringify({ error: "templateKey required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Try compliance-worker first
  try {
    const upstream = `${base}/api/v1/policies/generate`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY || "",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        templateKey,
        input: body.input || {},
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // Ensure content is always a flattened markdown string
      const policy = data?.data?.policy ?? data;
      if (!policy.content && policy.sections && Array.isArray(policy.sections)) {
        policy.content = policy.sections
          .map((s: { title: string; content: string }) => `## ${s.title}\n\n${s.content}`)
          .join("\n\n");
        policy.sizeBytes = new TextEncoder().encode(policy.content).byteLength;
      }
      await writeGeneratedPoliciesPreference(tenantId, templateKey);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Fall through to local generator on auth/server errors
  } catch {
    // Fall through to local generator
  }

  // Fallback: use local policy generator with enriched tenant context
  const policyType = POLICY_TYPE_FALLBACKS[templateKey] || "access_control";
  try {
    const ctx = await buildTenantContext(tenantId, user);

    const tenantContext = {
      tenantId,
      tenantName: ctx.tenantName,
      connectedApps: ctx.connectedApps,
      selectedFrameworks: ctx.selectedFrameworks,
      automationRuleCount: ctx.automationRuleCount,
      complianceScores: ctx.complianceScores,
      evidenceSummary: ctx.evidenceSummary,
    };

    const policy = await generateSecurityPolicy(env, tenantContext, policyType);

    await writeGeneratedPoliciesPreference(tenantId, templateKey);

    // Flatten sections into a single content string for the frontend
    const content = policy.sections.map((s) => `## ${s.title}\n\n${s.content}`).join("\n\n");
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
            reused: false,
          },
          source: "local",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Policy generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
