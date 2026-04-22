import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { t as toCamel } from './dto-qzAL3BiV.js';
import { queryPgOne, queryPg } from './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const GET = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const riskTier = url.searchParams.get("risk_tier") || "";
  const isAiTool = url.searchParams.get("is_ai_tool") || "";
  const status = url.searchParams.get("status") || "";
  const conditions = ["tenant_id = $1"];
  const params = [tenantId];
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
    const countRow = await queryPgOne(
      `SELECT COUNT(*) as total FROM discovered_apps WHERE ${where}`,
      params
    );
    const rows = await queryPg(
      `SELECT id, tenant_id, app_name, category, provider, user_count, risk_tier,
              is_ai_tool, marketplace_match, first_seen_at, last_seen_at, status, metadata,
              created_at, updated_at
       FROM discovered_apps
       WHERE ${where}
       ORDER BY is_ai_tool DESC, user_count DESC, last_seen_at DESC`,
      params
    );
    return json({ apps: toCamel(rows), total: countRow?.total ?? 0 });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) {
      return json({ apps: [], total: 0 });
    }
    console.error(
      JSON.stringify({ level: "error", message: "Discovery query failed", error: msg })
    );
    return json({ error: "Failed to query discovered apps", apps: [], total: 0 }, { status: 500 });
  }
};
const POST = async ({ locals, platform }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const orchestratorUrl = platform?.env?.ORCHESTRATOR_URL;
  if (!orchestratorUrl) {
    return json(
      { error: "OAuth grant scan not available — orchestrator not configured" },
      { status: 503 }
    );
  }
  const upstream = await fetch(`${orchestratorUrl}/api/v1/discovery/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId
    }
  });
  const body = await upstream.json().catch(() => ({}));
  return json(body, { status: upstream.status });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-CoAADBos.js.map
