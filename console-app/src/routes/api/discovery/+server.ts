import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { toCamel } from "$lib/utils/dto";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const riskTier = url.searchParams.get("risk_tier") || "";
  const isAiTool = url.searchParams.get("is_ai_tool") || "";
  const status = url.searchParams.get("status") || "";

  const conditions: string[] = ["tenant_id = $1"];
  const params: any[] = [tenantId];

  if (riskTier) {
    params.push(riskTier);
    conditions.push(`risk_tier = $${params.length}`);
  }

  if (isAiTool !== "") {
    params.push(isAiTool === "1" || isAiTool === "true");
    conditions.push(`is_ai_tool = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.join(" AND ");

  try {
    const countRow = await queryPgOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM discovered_apps WHERE ${where}`,
      params,
    );

    const rows = await queryPg<any>(
      `SELECT id, tenant_id, app_name, category, provider, user_count, risk_tier,
              is_ai_tool, marketplace_match, first_seen_at, last_seen_at, status, metadata,
              created_at, updated_at
       FROM discovered_apps
       WHERE ${where}
       ORDER BY is_ai_tool DESC, user_count DESC, last_seen_at DESC`,
      params,
    );

    return json({ apps: toCamel(rows), total: countRow?.total ?? 0 });
  } catch (err: any) {
    const msg = String(err);
    if (msg.includes("does not exist")) {
      return json({ apps: [], total: 0 });
    }
    console.error(
      JSON.stringify({ level: "error", message: "Discovery query failed", error: msg }),
    );
    return json({ error: "Failed to query discovered apps", apps: [], total: 0 }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const orchestratorUrl = (platform?.env as any)?.ORCHESTRATOR_URL as string | undefined;

  if (!orchestratorUrl) {
    return json(
      { error: "OAuth grant scan not available — orchestrator not configured" },
      { status: 503 },
    );
  }

  const upstream = await fetch(`${orchestratorUrl}/api/v1/discovery/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    },
  });

  const body = await upstream.json().catch(() => ({}));
  return json(body, { status: upstream.status });
};
