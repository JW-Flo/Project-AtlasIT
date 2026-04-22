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
  const guard = requireTenantRole(user, ["owner", "admin", "viewer"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  try {
    const status = url.searchParams.get("status") || "";
    const type = url.searchParams.get("type") || "";
    const provider = url.searchParams.get("provider") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const conditions = ["nc.tenant_id = $1"];
    const params = [tenantId];
    if (status) {
      params.push(status);
      conditions.push(`nc.status = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`nc.credential_type = $${params.length}`);
    }
    if (provider) {
      params.push(provider);
      conditions.push(`nc.provider = $${params.length}`);
    }
    const where = conditions.join(" AND ");
    const countRow = await queryPgOne(
      `SELECT COUNT(*) as total FROM nhi_credentials nc WHERE ${where}`,
      params
    );
    params.push(limit, offset);
    const rows = await queryPg(
      `SELECT nc.id, nc.tenant_id, nc.directory_user_id, nc.credential_type, nc.provider,
              nc.external_id, nc.display_name, nc.owner_email, nc.scopes, nc.permissions,
              nc.expires_at, nc.last_used_at, nc.last_rotated_at, nc.risk_score, nc.risk_factors,
              nc.status, nc.metadata, nc.created_at, nc.updated_at,
              du.email as linked_user_email, du.display_name as linked_user_name
       FROM nhi_credentials nc
       LEFT JOIN directory_users du ON du.id = nc.directory_user_id
       WHERE ${where}
       ORDER BY nc.risk_score DESC, nc.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return json({ credentials: toCamel(rows), total: countRow?.total ?? 0 });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) {
      return json({ credentials: [], total: 0 });
    }
    console.error(JSON.stringify({ level: "error", message: "NHI query failed", error: msg }));
    return json(
      { error: "Failed to query NHI credentials", credentials: [], total: 0 },
      { status: 500 }
    );
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
      { error: "NHI discovery not available — orchestrator not configured" },
      { status: 503 }
    );
  }
  const upstream = await fetch(`${orchestratorUrl}/api/v1/nhi/sync`, {
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
//# sourceMappingURL=_server.ts-DH-KahKN.js.map
