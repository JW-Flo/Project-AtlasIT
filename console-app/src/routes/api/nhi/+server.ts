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

function mapNhiRow(row: Record<string, unknown>): Record<string, unknown> {
  const mapped = { ...row };
  mapped.scopes = parseJsonField(mapped.scopes);
  mapped.risk_factors = parseJsonField(mapped.risk_factors);
  mapped.metadata = parseJsonField(mapped.metadata);
  return mapped;
}

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  try {
    const status = url.searchParams.get("status") || "";
    const type = url.searchParams.get("type") || "";
    const provider = url.searchParams.get("provider") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const conditions: string[] = ["nc.tenant_id = ?"];
    const binds: any[] = [tenantId];

    if (status) {
      conditions.push("nc.status = ?");
      binds.push(status);
    }

    if (type) {
      conditions.push("nc.credential_type = ?");
      binds.push(type);
    }

    if (provider) {
      conditions.push("nc.provider = ?");
      binds.push(provider);
    }

    const where = conditions.join(" AND ");

    const countRow = await db
      .prepare(`SELECT COUNT(*) as total FROM nhi_credentials nc WHERE ${where}`)
      .bind(...binds)
      .first();

    const rows = await db
      .prepare(
        `SELECT nc.id, nc.tenant_id, nc.directory_user_id, nc.credential_type, nc.provider,
              nc.external_id, nc.display_name, nc.owner_email, nc.scopes, nc.permissions,
              nc.expires_at, nc.last_used_at, nc.last_rotated_at, nc.risk_score, nc.risk_factors,
              nc.status, nc.metadata, nc.created_at, nc.updated_at,
              du.email as linked_user_email, du.display_name as linked_user_name
       FROM nhi_credentials nc
       LEFT JOIN directory_users du ON du.id = nc.directory_user_id
       WHERE ${where}
       ORDER BY nc.risk_score DESC, nc.updated_at DESC
       LIMIT ? OFFSET ?`,
      )
      .bind(...binds, limit, offset)
      .all()
      .then((r: any) => r.results || []);

    const mapped = rows.map(mapNhiRow);

    return json({ credentials: toCamel(mapped), total: countRow?.total ?? 0 });
  } catch (err: any) {
    const msg = String(err);
    // Table may not exist yet — return empty results instead of 500
    if (msg.includes("no such table")) {
      return json({ credentials: [], total: 0 });
    }
    console.error(JSON.stringify({ level: "error", message: "NHI query failed", error: msg }));
    return json(
      { error: "Failed to query NHI credentials", credentials: [], total: 0 },
      { status: 500 },
    );
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
      { message: "NHI discovery not available — orchestrator not configured" },
      { status: 202 },
    );
  }

  const upstream = await fetch(`${orchestratorUrl}/api/v1/nhi/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    },
  });

  const body = await upstream.json().catch(() => ({}));
  return json(body, { status: upstream.status });
};
