import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../_proxy-helpers";
import { generateSecurityPolicy } from "@atlasit/shared";
import type { PolicyType } from "@atlasit/shared";

const POLICY_TYPE_FALLBACKS: Record<string, PolicyType> = {
  "soc2.demo": "access_control",
  "iso27001.isms": "access_control",
  "access_control": "access_control",
  "incident_response": "incident_response",
  "data_handling": "data_handling",
  "password": "password",
  "acceptable_use": "acceptable_use",
};

async function writeGeneratedPoliciesPreference(
  db: any,
  tenantId: string,
  policyKey: string,
): Promise<void> {
  try {
    const existing = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'generated_policies'",
      )
      .bind(tenantId)
      .first<{ value: string }>();
    const current: string[] = existing?.value ? JSON.parse(existing.value) : [];
    if (!current.includes(policyKey)) current.push(policyKey);
    const newValue = JSON.stringify(current);
    await db
      .prepare(
        `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
         VALUES (?, 'generated_policies', ?, datetime('now'))
         ON CONFLICT(tenant_id, key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      )
      .bind(tenantId, newValue, newValue)
      .run();
  } catch {
    // Non-fatal
  }
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

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;

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
      if (db) await writeGeneratedPoliciesPreference(db, tenantId, templateKey);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Fall through to local generator on auth/server errors
  } catch {
    // Fall through to local generator
  }

  // Fallback: use local policy generator
  const policyType = POLICY_TYPE_FALLBACKS[templateKey] || "access_control";
  try {
    // Build minimal tenant context
    let connectedApps: string[] = [];
    let frameworks: string[] = [];
    if (db) {
      try {
        const [appsResult, fwResult] = await Promise.all([
          db.prepare("SELECT app_id FROM app_credentials WHERE tenant_id = ?").bind(tenantId).all(),
          db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'").bind(tenantId).first(),
        ]);
        connectedApps = (appsResult?.results || []).map((r: any) => r.app_id);
        if (fwResult?.value) frameworks = JSON.parse(fwResult.value as string);
      } catch { /* use defaults */ }
    }

    const tenantContext = {
      tenantId,
      tenantName: (user as any).tenantName || "Organization",
      connectedApps,
      selectedFrameworks: frameworks.length > 0 ? frameworks : ["SOC2"],
      automationRuleCount: 0,
      complianceScores: {},
      evidenceSummary: "No evidence data available.",
    };

    const policy = await generateSecurityPolicy(env, tenantContext, policyType);

    if (db) await writeGeneratedPoliciesPreference(db, tenantId, templateKey);

    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          policy,
          source: "local",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Policy generation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
