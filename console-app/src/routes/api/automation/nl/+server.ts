import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { buildAutomationFromNL, analyzeComplianceGaps } from "@atlasit/shared";

/**
 * POST /api/automation/nl
 * Natural language → automation rule + compliance mapping preview.
 *
 * Body: { prompt: string, connectedApps?: string[], directoryGroups?: string[] }
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;

  let body: {
    prompt?: string;
    connectedApps?: string[];
    directoryGroups?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = body?.prompt?.trim();
  if (!prompt || prompt.length < 5) {
    return json({ error: "prompt must be at least 5 characters" }, { status: 400 });
  }
  if (prompt.length > 1000) {
    return json({ error: "prompt must be at most 1000 characters" }, { status: 400 });
  }

  // Auto-populate tenant context if not provided
  let connectedApps = body.connectedApps;
  let directoryGroups = body.directoryGroups;

  if (!connectedApps && db) {
    try {
      const { results } = await db
        .prepare(
          "SELECT DISTINCT app_name FROM connected_apps WHERE tenant_id = ? AND status = 'active'",
        )
        .bind(tenantId)
        .all();
      connectedApps = (results ?? []).map((r: any) => r.app_name);
    } catch {
      // table may not exist
    }
  }

  if (!directoryGroups && db) {
    try {
      const { results } = await db
        .prepare("SELECT DISTINCT name FROM directory_groups WHERE tenant_id = ? LIMIT 50")
        .bind(tenantId)
        .all();
      directoryGroups = (results ?? []).map((r: any) => r.name);
    } catch {
      // table may not exist
    }
  }

  // Check AI provider is configured
  if (!env.GROQ_API_KEY && !env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    return json(
      {
        error: "AI provider not configured",
        detail:
          "GROQ_API_KEY secret must be set for the console-app worker. Run: wrangler secret put GROQ_API_KEY --name atlasit-console",
      },
      { status: 503 },
    );
  }

  // Gather compliance gaps and existing rules for context enrichment
  let complianceGaps: any[] | undefined;
  let existingRulesSummary: string[] | undefined;

  if (db) {
    try {
      const prefRow = await db
        .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'")
        .bind(tenantId)
        .first<{ value: string }>();

      const frameworks = prefRow?.value ? JSON.parse(prefRow.value) : ["SOC2"];
      const gapResult = await analyzeComplianceGaps(db, tenantId, frameworks);
      complianceGaps = gapResult.gaps
        .filter((g: any) => g.priority === "critical" || g.priority === "high")
        .slice(0, 5);
    } catch {
      // gap analysis unavailable
    }

    try {
      const { results: ruleRows } = await db
        .prepare(
          "SELECT name, trigger_type, actions FROM automation_rules WHERE tenant_id = ? AND enabled = 1 LIMIT 20",
        )
        .bind(tenantId)
        .all<{ name: string; trigger_type: string; actions: string }>();

      existingRulesSummary = (ruleRows ?? []).map(
        (r) => `${r.name} (trigger: ${r.trigger_type}, actions: ${r.actions})`,
      );
    } catch {
      // rules table may not exist
    }
  }

  try {
    const result = await buildAutomationFromNL(env, {
      prompt,
      connectedApps,
      directoryGroups,
      complianceGaps,
      existingRulesSummary,
    });

    return json({
      status: "success",
      data: result,
    });
  } catch (err: any) {
    console.error("NL automation build failed:", err?.message);
    return json(
      {
        error: "Failed to build automation from prompt",
        detail: err?.message || "Unknown error",
      },
      { status: 422 },
    );
  }
};
