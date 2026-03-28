import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { toCamel } from "$lib/utils/dto";

function parseJsonField(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function mapDiscoveredRow(row: Record<string, unknown>): Record<string, unknown> {
  const mapped = { ...row };
  mapped.metadata = parseJsonField(mapped.metadata);
  return mapped;
}

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ apps: [], total: 0 });

  const riskTier = url.searchParams.get("risk_tier") || "";
  const isAiTool = url.searchParams.get("is_ai_tool") || "";
  const status = url.searchParams.get("status") || "";

  const conditions: string[] = ["tenant_id = ?"];
  const binds: any[] = [tenantId];

  if (riskTier) {
    conditions.push("risk_tier = ?");
    binds.push(riskTier);
  }

  if (isAiTool !== "") {
    conditions.push("is_ai_tool = ?");
    binds.push(parseInt(isAiTool, 10));
  }

  if (status) {
    conditions.push("status = ?");
    binds.push(status);
  }

  const where = conditions.join(" AND ");

  const countRow = await db
    .prepare(`SELECT COUNT(*) as total FROM discovered_apps WHERE ${where}`)
    .bind(...binds)
    .first();

  const rows = await db
    .prepare(
      `SELECT id, tenant_id, app_name, category, provider, user_count, risk_tier,
              is_ai_tool, marketplace_match, first_seen_at, last_seen_at, status, metadata,
              created_at, updated_at
       FROM discovered_apps
       WHERE ${where}
       ORDER BY is_ai_tool DESC, user_count DESC, last_seen_at DESC`,
    )
    .bind(...binds)
    .all()
    .then((r: any) => r.results || []);

  const mapped = rows.map(mapDiscoveredRow);

  return json({ apps: toCamel(mapped), total: countRow?.total ?? 0 });
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
      { message: "OAuth grant scan not available — orchestrator not configured" },
      { status: 202 },
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
