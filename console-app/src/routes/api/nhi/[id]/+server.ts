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

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const { id } = params;

  const row = await db
    .prepare(
      `SELECT nc.id, nc.tenant_id, nc.directory_user_id, nc.credential_type, nc.provider,
              nc.external_id, nc.display_name, nc.owner_email, nc.scopes, nc.permissions,
              nc.expires_at, nc.last_used_at, nc.last_rotated_at, nc.risk_score, nc.risk_factors,
              nc.status, nc.metadata, nc.created_at, nc.updated_at,
              du.email as linked_user_email, du.display_name as linked_user_name
       FROM nhi_credentials nc
       LEFT JOIN directory_users du ON du.id = nc.directory_user_id
       WHERE nc.id = ? AND nc.tenant_id = ?`,
    )
    .bind(id, tenantId)
    .first();

  if (!row) return json({ error: "not found" }, { status: 404 });

  const auditRows = await db
    .prepare(
      `SELECT id, credential_id, action, actor, details, created_at
       FROM nhi_audit_log
       WHERE credential_id = ? AND tenant_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
    )
    .bind(id, tenantId)
    .all()
    .then((r: any) => r.results || []);

  const auditMapped = auditRows.map((entry: Record<string, unknown>) => {
    const e = { ...entry };
    e.details = parseJsonField(e.details);
    return e;
  });

  const credential = mapNhiRow(row as Record<string, unknown>);

  return json({
    credential: toCamel(credential),
    auditLog: toCamel(auditMapped),
  });
};

export const PATCH: RequestHandler = async ({
  params,
  request,
  locals,
  platform,
}) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const { id } = params;

  const existing = await db
    .prepare(
      `SELECT id, owner_email, status FROM nhi_credentials WHERE id = ? AND tenant_id = ?`,
    )
    .bind(id, tenantId)
    .first();

  if (!existing) return json({ error: "not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "invalid request body" }, { status: 400 });

  const { ownerEmail, status } = body as {
    ownerEmail?: string;
    status?: string;
  };

  const ALLOWED_STATUSES = ["active", "revoked", "rotation_pending"];
  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return json({ error: "invalid status value" }, { status: 400 });
  }

  const updates: string[] = [];
  const binds: any[] = [];

  if (ownerEmail !== undefined) {
    updates.push("owner_email = ?");
    binds.push(ownerEmail);
  }

  if (status !== undefined) {
    updates.push("status = ?");
    binds.push(status);
  }

  if (updates.length === 0) {
    return json({ error: "no updatable fields provided" }, { status: 400 });
  }

  const now = new Date().toISOString();
  updates.push("updated_at = ?");
  binds.push(now, id, tenantId);

  await db
    .prepare(
      `UPDATE nhi_credentials SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`,
    )
    .bind(...binds)
    .run();

  const changes: Record<string, unknown> = {};
  if (ownerEmail !== undefined) changes.owner_email = ownerEmail;
  if (status !== undefined) changes.status = status;

  await db
    .prepare(
      `INSERT INTO nhi_audit_log (id, tenant_id, credential_id, action, actor, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      tenantId,
      id,
      "nhi_credential.updated",
      user.email,
      JSON.stringify({ changes }),
      now,
    )
    .run();

  const updated = await db
    .prepare(
      `SELECT nc.id, nc.tenant_id, nc.directory_user_id, nc.credential_type, nc.provider,
              nc.external_id, nc.display_name, nc.owner_email, nc.scopes, nc.permissions,
              nc.expires_at, nc.last_used_at, nc.last_rotated_at, nc.risk_score, nc.risk_factors,
              nc.status, nc.metadata, nc.created_at, nc.updated_at
       FROM nhi_credentials nc
       WHERE nc.id = ? AND nc.tenant_id = ?`,
    )
    .bind(id, tenantId)
    .first();

  if (!updated) return json({ error: "update succeeded but row not found" }, { status: 500 });
  return json({ credential: toCamel(mapNhiRow(updated as Record<string, unknown>)) });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const { id } = params;

  const existing = await db
    .prepare(
      `SELECT id, status FROM nhi_credentials WHERE id = ? AND tenant_id = ?`,
    )
    .bind(id, tenantId)
    .first();

  if (!existing) return json({ error: "not found" }, { status: 404 });

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE nhi_credentials SET status = 'revoked', updated_at = ? WHERE id = ? AND tenant_id = ?`,
    )
    .bind(now, id, tenantId)
    .run();

  await db
    .prepare(
      `INSERT INTO nhi_audit_log (id, tenant_id, credential_id, action, actor, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      tenantId,
      id,
      "nhi_credential.revoked",
      user.email,
      JSON.stringify({ previous_status: (existing as any).status }),
      now,
    )
    .run();

  return json({ success: true, id });
};
