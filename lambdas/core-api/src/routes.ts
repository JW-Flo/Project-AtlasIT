/**
 * core-api Lambda routes
 *
 * Ported from core-api/src/ (Cloudflare Worker).
 * Uses bootstrap() service container instead of Cloudflare env bindings.
 *
 * Key translations:
 *   env.DB.prepare(...)         → svc.tenantRepo / pg pool
 *   env.KV_SESSIONS.get(...)    → svc.sessionRepo.get(...)
 *   env.KV_FEATURE_FLAGS.get(…) → svc.flagRepo.get(...)
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { extractAuth, AuthError } from "@atlasit/shared/auth/lambda-auth.js";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;

// Module-level singleton — reused across warm Lambda invocations
const svc = bootstrap();

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return _pool;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
} as const;

function ok(body: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function fail(status: number, message: string, code = "ERROR"): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify({ status: "error", code, message, timestamp: new Date().toISOString() }),
  };
}

function body(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath;
  const method = event.requestContext.http.method.toUpperCase();
  const qs = event.queryStringParameters ?? {};
  const requestId = event.requestContext.requestId;

  // ── Health (no auth) ──────────────────────────────────────────────────────
  if (path === "/health" && method === "GET") {
    return ok({
      status: "healthy",
      service: "core-api",
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  // ── Auth routes ────────────────────────────────────────────────────────────

  // POST /api/v1/auth/validate — validate session token
  if (path === "/api/v1/auth/validate" && method === "POST") {
    try {
      const auth = await extractAuth(event, svc.authRepo);
      return ok({ status: "success", data: auth, timestamp: new Date().toISOString() });
    } catch (e) {
      if (e instanceof AuthError) return fail(e.status, e.message, "UNAUTHORIZED");
      return fail(401, "Authentication failed", "UNAUTHORIZED");
    }
  }

  // All remaining routes require authentication
  let auth: Awaited<ReturnType<typeof extractAuth>>;
  try {
    auth = await extractAuth(event, svc.authRepo);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.status, e.message, "UNAUTHORIZED");
    return fail(401, "Authentication required", "UNAUTHORIZED");
  }

  const pool = getPool();

  // ── Tenant routes ──────────────────────────────────────────────────────────

  // GET /api/v1/tenants — list tenants (admin only)
  if (path === "/api/v1/tenants" && method === "GET") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 100);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;
    const result = await pool.query(
      `SELECT id, name, slug, industry, status, tier, config, created_at as "createdAt"
       FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const countRow = await pool.query(`SELECT COUNT(*) as total FROM tenants`);
    return ok({
      status: "success",
      data: result.rows,
      meta: { total: parseInt(countRow.rows[0]?.total ?? "0", 10), limit, offset },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/tenants/:id — get tenant by ID
  const tenantByIdMatch = path.match(/^\/api\/v1\/tenants\/([^/]+)$/);
  if (tenantByIdMatch && method === "GET") {
    const [, id] = tenantByIdMatch;
    // Non-admins can only access their own tenant
    if (auth.role !== "admin" && auth.tenantId !== id) {
      return fail(403, "Access denied", "FORBIDDEN");
    }
    const tenant = await svc.tenantRepo.getById(id);
    if (!tenant) return fail(404, "Tenant not found", "NOT_FOUND");
    return ok({ status: "success", data: tenant, timestamp: new Date().toISOString() });
  }

  // POST /api/v1/tenants — create tenant
  if (path === "/api/v1/tenants" && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const b = body(event) as { name?: string; slug?: string; industry?: string; tier?: string };
    if (!b.name || !b.slug) return fail(400, "name and slug are required", "VALIDATION_FAILED");
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO tenants (id, name, slug, industry, status, tier, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'onboarding', $5, NOW(), NOW())`,
      [id, b.name, b.slug, b.industry ?? null, b.tier ?? "free"],
    );
    await svc.auditRepo.log({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorType: "user",
      action: "tenant.created",
      resourceType: "tenant",
      resourceId: id,
      correlationId: requestId,
    });
    const tenant = await svc.tenantRepo.getById(id);
    return ok({ status: "success", data: tenant, timestamp: new Date().toISOString() }, 201);
  }

  // PATCH /api/v1/tenants/:id — update tenant
  const tenantPatchMatch = path.match(/^\/api\/v1\/tenants\/([^/]+)$/);
  if (tenantPatchMatch && method === "PATCH") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, id] = tenantPatchMatch;
    const b = body(event) as { name?: string; industry?: string; status?: string; tier?: string; config?: unknown };
    const updates: string[] = [];
    const vals: unknown[] = [];
    if (b.name !== undefined) { updates.push(`name = $${vals.length + 1}`); vals.push(b.name); }
    if (b.industry !== undefined) { updates.push(`industry = $${vals.length + 1}`); vals.push(b.industry); }
    if (b.status !== undefined) { updates.push(`status = $${vals.length + 1}`); vals.push(b.status); }
    if (b.tier !== undefined) { updates.push(`tier = $${vals.length + 1}`); vals.push(b.tier); }
    if (b.config !== undefined) { updates.push(`config = $${vals.length + 1}`); vals.push(JSON.stringify(b.config)); }
    if (updates.length === 0) return fail(400, "No fields to update", "VALIDATION_FAILED");
    vals.push(id);
    await pool.query(
      `UPDATE tenants SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${vals.length}`,
      vals,
    );
    const tenant = await svc.tenantRepo.getById(id);
    if (!tenant) return fail(404, "Tenant not found", "NOT_FOUND");
    return ok({ status: "success", data: tenant, timestamp: new Date().toISOString() });
  }

  // ── Event routes ────────────────────────────────────────────────────────────

  // POST /api/v1/events — publish event
  if (path === "/api/v1/events" && method === "POST") {
    const b = body(event) as {
      tenantId?: string;
      type?: string;
      source?: string;
      payload?: unknown;
      idempotencyKey?: string;
    };
    if (!b.tenantId || !b.type || !b.source) {
      return fail(400, "tenantId, type, and source are required", "VALIDATION_FAILED");
    }
    // Non-admins can only publish for their own tenant
    if (auth.role !== "admin" && auth.tenantId !== b.tenantId) {
      return fail(403, "Tenant access denied", "FORBIDDEN");
    }
    if (b.idempotencyKey) {
      const existing = await pool.query<{ id: string; status: string }>(
        "SELECT id, status FROM events WHERE idempotency_key = $1",
        [b.idempotencyKey],
      );
      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        return ok({
          status: "success",
          data: { id: row.id, status: row.status, deduplicated: true },
          timestamp: new Date().toISOString(),
        });
      }
    }
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO events (id, tenant_id, type, source, payload, status, idempotency_key, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())`,
      [id, b.tenantId, b.type, b.source, b.payload ? JSON.stringify(b.payload) : null, b.idempotencyKey ?? null],
    );
    return ok(
      { status: "success", data: { id, type: b.type, source: b.source, status: "pending" }, timestamp: new Date().toISOString() },
      201,
    );
  }

  // GET /api/v1/events — list events
  if (path === "/api/v1/events" && method === "GET") {
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 200);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;
    const tenantId = auth.role === "admin" ? (qs.tenantId ?? auth.tenantId) : auth.tenantId;
    const result = await pool.query(
      `SELECT id, tenant_id as "tenantId", type, source, status, created_at as "createdAt"
       FROM events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
    return ok({
      status: "success",
      data: result.rows,
      meta: { limit, offset },
      timestamp: new Date().toISOString(),
    });
  }

  // ── Feature flag routes ─────────────────────────────────────────────────────

  // GET /api/v1/flags — list all feature flags
  if (path === "/api/v1/flags" && method === "GET") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const flags = await svc.flagRepo.listAll();
    return ok({ status: "success", data: flags, timestamp: new Date().toISOString() });
  }

  // GET /api/v1/flags/:name — get a feature flag
  const flagMatch = path.match(/^\/api\/v1\/flags\/([^/]+)$/);
  if (flagMatch && method === "GET") {
    const [, name] = flagMatch;
    const flag = await svc.flagRepo.get(name);
    if (!flag) return fail(404, "Flag not found", "NOT_FOUND");
    return ok({ status: "success", data: flag, timestamp: new Date().toISOString() });
  }

  // PUT /api/v1/flags/:name — create or update a feature flag
  if (flagMatch && method === "PUT") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, name] = flagMatch;
    const b = body(event) as { enabled?: boolean; rolloutPct?: number; tenantOverrides?: Record<string, boolean> };
    await svc.flagRepo.set({
      name,
      enabled: b.enabled ?? true,
      rolloutPct: b.rolloutPct ?? 100,
      tenantOverrides: b.tenantOverrides ?? {},
    });
    const flag = await svc.flagRepo.get(name);
    return ok({ status: "success", data: flag, timestamp: new Date().toISOString() });
  }

  // POST /api/v1/flags — create a new feature flag
  if (path === "/api/v1/flags" && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const b = body(event) as {
      key?: string;
      name?: string;
      description?: string;
      enabled?: boolean;
      rolloutPercentage?: number;
      tenantOverrides?: Record<string, boolean>;
      tierMinimum?: string;
      killSwitch?: boolean;
    };
    if (!b.key || !b.name) return fail(400, "key and name are required", "VALIDATION_FAILED");
    const existing = await svc.flagRepo.get(b.key);
    if (existing) return fail(409, "A flag with this key already exists", "CONFLICT");
    const now = new Date().toISOString();
    const flag = {
      name: b.key,
      enabled: b.enabled ?? true,
      rolloutPct: b.rolloutPercentage ?? 100,
      tenantOverrides: b.tenantOverrides ?? {},
      description: b.description,
      tierMinimum: b.tierMinimum,
      killSwitch: b.killSwitch ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await svc.flagRepo.set(flag);
    return ok({ status: "success", data: flag, timestamp: now }, 201);
  }

  // PATCH /api/v1/flags/:key — update a feature flag
  if (flagMatch && method === "PATCH") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, key] = flagMatch;
    const existing = await svc.flagRepo.get(key);
    if (!existing) return fail(404, "Flag not found", "NOT_FOUND");
    const b = body(event) as {
      name?: string;
      description?: string;
      enabled?: boolean;
      rolloutPercentage?: number;
      tenantOverrides?: Record<string, boolean>;
      tierMinimum?: string;
      killSwitch?: boolean;
    };
    const updated = {
      ...existing,
      ...b,
      name: key,
      rolloutPct: b.rolloutPercentage ?? existing.rolloutPct,
      updatedAt: new Date().toISOString(),
    };
    await svc.flagRepo.set(updated);
    return ok({ status: "success", data: updated, timestamp: new Date().toISOString() });
  }

  // DELETE /api/v1/flags/:key — delete a feature flag
  if (flagMatch && method === "DELETE") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, key] = flagMatch;
    const existing = await svc.flagRepo.get(key);
    if (!existing) return fail(404, "Flag not found", "NOT_FOUND");
    await svc.flagRepo.delete(key);
    return ok({ status: "success", data: { key, deleted: true }, timestamp: new Date().toISOString() });
  }

  // POST /api/v1/flags/:key/evaluate — evaluate flag for given context
  const flagEvaluateMatch = path.match(/^\/api\/v1\/flags\/([^/]+)\/evaluate$/);
  if (flagEvaluateMatch && method === "POST") {
    const [, key] = flagEvaluateMatch;
    const b = body(event) as { tenantId?: string; tenantTier?: string; userId?: string };
    if (!b.tenantId) return fail(400, "tenantId is required", "VALIDATION_FAILED");
    const flag = await svc.flagRepo.get(key);
    if (!flag) return fail(404, "Flag not found", "NOT_FOUND");
    // Simple evaluation logic
    let enabled = flag.enabled;
    if (flag.killSwitch) enabled = false;
    if (flag.tenantOverrides?.[b.tenantId] !== undefined) {
      enabled = flag.tenantOverrides[b.tenantId];
    }
    return ok({
      status: "success",
      data: { key, enabled, reason: flag.killSwitch ? "kill_switch" : "evaluated" },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/flags/:key/kill — toggle kill switch
  const flagKillMatch = path.match(/^\/api\/v1\/flags\/([^/]+)\/kill$/);
  if (flagKillMatch && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, key] = flagKillMatch;
    const flag = await svc.flagRepo.get(key);
    if (!flag) return fail(404, "Flag not found", "NOT_FOUND");
    const updated = {
      ...flag,
      killSwitch: !flag.killSwitch,
      updatedAt: new Date().toISOString(),
    };
    await svc.flagRepo.set(updated);
    return ok({ status: "success", data: updated, timestamp: new Date().toISOString() });
  }

  // ── Tenant DELETE route ─────────────────────────────────────────────────────

  // DELETE /api/v1/tenants/:id — delete tenant
  const tenantDeleteMatch = path.match(/^\/api\/v1\/tenants\/([^/]+)$/);
  if (tenantDeleteMatch && method === "DELETE") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, id] = tenantDeleteMatch;
    const existing = await pool.query("SELECT id FROM tenants WHERE id = $1", [id]);
    if (existing.rows.length === 0) return fail(404, "Tenant not found", "NOT_FOUND");
    await pool.query("DELETE FROM tenants WHERE id = $1", [id]);
    return ok({ status: "success", data: { id, deleted: true }, timestamp: new Date().toISOString() });
  }

  // ── Event routes (continued) ────────────────────────────────────────────────

  // GET /api/v1/events/:id — get single event
  const eventByIdMatch = path.match(/^\/api\/v1\/events\/([^/]+)$/);
  if (eventByIdMatch && method === "GET") {
    const [, id] = eventByIdMatch;
    const result = await pool.query(
      `SELECT id, tenant_id as "tenantId", type, source, payload, status,
              idempotency_key as "idempotencyKey", created_at as "createdAt"
       FROM events WHERE id = $1 AND tenant_id = $2`,
      [id, auth.tenantId],
    );
    if (result.rows.length === 0) return fail(404, "Event not found", "NOT_FOUND");
    return ok({ status: "success", data: result.rows[0], timestamp: new Date().toISOString() });
  }

  // ── Auth routes (continued) ─────────────────────────────────────────────────

  // POST /api/v1/auth/token — placeholder for token issuance
  if (path === "/api/v1/auth/token" && method === "POST") {
    const b = body(event) as { email?: string; tenantId?: string };
    if (!b.email || !b.tenantId) return fail(400, "email and tenantId are required", "VALIDATION_FAILED");
    const user = await pool.query(
      `SELECT id, email, role, status FROM users WHERE email = $1 AND tenant_id = $2`,
      [b.email, b.tenantId],
    );
    if (user.rows.length === 0) return fail(404, "User not found", "NOT_FOUND");
    const u = user.rows[0];
    if (u.status !== "active") return fail(403, "User account is not active", "FORBIDDEN");
    // Token issuance not yet implemented — return 501
    return fail(501, "Token issuance not yet implemented", "NOT_IMPLEMENTED");
  }

  // ── Credential routes ───────────────────────────────────────────────────────

  // POST /api/v1/credentials — store credential
  if (path === "/api/v1/credentials" && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const b = body(event) as { tenantId?: string; appId?: string; credentials?: Record<string, string> };
    if (!b.tenantId || !b.appId || !b.credentials) {
      return fail(400, "tenantId, appId, and credentials are required", "VALIDATION_FAILED");
    }
    // Non-admins can only store credentials for their own tenant
    if (auth.tenantId !== b.tenantId && auth.role !== "admin") {
      return fail(403, "Tenant access denied", "FORBIDDEN");
    }
    const id = crypto.randomUUID();
    // SECURITY WARNING: Base64 is NOT encryption. This is a placeholder implementation.
    // In production, use AWS KMS envelope encryption or similar proper encryption.
    // The column name 'encrypted_credentials' is misleading — this is just encoded.
    const encryptedCreds = Buffer.from(JSON.stringify(b.credentials)).toString("base64");
    await pool.query(
      `INSERT INTO app_credentials (id, tenant_id, app_id, encrypted_credentials, connected_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (tenant_id, app_id) DO UPDATE SET encrypted_credentials = EXCLUDED.encrypted_credentials, updated_at = NOW()`,
      [id, b.tenantId, b.appId, encryptedCreds],
    );
    return ok({
      status: "success",
      data: { id, appId: b.appId, tenantId: b.tenantId },
      timestamp: new Date().toISOString(),
    }, 201);
  }

  // GET /api/v1/credentials — list credentials (metadata only)
  if (path === "/api/v1/credentials" && method === "GET") {
    const qsTenantId = qs.tenantId ?? auth.tenantId;
    if (auth.role !== "admin" && qsTenantId !== auth.tenantId) {
      return fail(403, "Tenant access denied", "FORBIDDEN");
    }
    const result = await pool.query(
      `SELECT id, tenant_id as "tenantId", app_id as "appId", healthy, last_test_at as "lastTestAt",
              connected_at as "connectedAt", updated_at as "updatedAt"
       FROM app_credentials WHERE tenant_id = $1`,
      [qsTenantId],
    );
    return ok({ status: "success", data: result.rows, timestamp: new Date().toISOString() });
  }

  // GET /api/v1/credentials/:tenantId/:appId — retrieve and decrypt
  const credGetMatch = path.match(/^\/api\/v1\/credentials\/([^/]+)\/([^/]+)$/);
  if (credGetMatch && method === "GET") {
    const [, credTenantId, appId] = credGetMatch;
    if (auth.role !== "admin" && credTenantId !== auth.tenantId) {
      return fail(403, "Tenant access denied", "FORBIDDEN");
    }
    const result = await pool.query(
      `SELECT encrypted_credentials FROM app_credentials WHERE tenant_id = $1 AND app_id = $2`,
      [credTenantId, appId],
    );
    if (result.rows.length === 0) return fail(404, "Credential not found", "NOT_FOUND");
    const decrypted = JSON.parse(Buffer.from(result.rows[0].encrypted_credentials, "base64").toString("utf8"));
    return ok({
      status: "success",
      data: { tenantId: credTenantId, appId, credentials: decrypted },
      timestamp: new Date().toISOString(),
    });
  }

  // PUT /api/v1/credentials/:tenantId/:appId — rotate credential
  if (credGetMatch && method === "PUT") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, credTenantId, appId] = credGetMatch;
    const b = body(event) as { credentials?: Record<string, string> };
    if (!b.credentials) return fail(400, "credentials are required", "VALIDATION_FAILED");
    const existing = await pool.query(
      "SELECT id FROM app_credentials WHERE tenant_id = $1 AND app_id = $2",
      [credTenantId, appId],
    );
    if (existing.rows.length === 0) return fail(404, "Credential not found", "NOT_FOUND");
    const encryptedCreds = Buffer.from(JSON.stringify(b.credentials)).toString("base64");
    await pool.query(
      `UPDATE app_credentials SET encrypted_credentials = $1, updated_at = NOW() WHERE tenant_id = $2 AND app_id = $3`,
      [encryptedCreds, credTenantId, appId],
    );
    return ok({
      status: "success",
      data: { tenantId: credTenantId, appId, rotated: true },
      timestamp: new Date().toISOString(),
    });
  }

  // DELETE /api/v1/credentials/:tenantId/:appId — delete credential
  if (credGetMatch && method === "DELETE") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, credTenantId, appId] = credGetMatch;
    await pool.query("DELETE FROM app_credentials WHERE tenant_id = $1 AND app_id = $2", [credTenantId, appId]);
    return ok({
      status: "success",
      data: { tenantId: credTenantId, appId, deleted: true },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/credentials/:tenantId/:appId/test — test credential health
  const credTestMatch = path.match(/^\/api\/v1\/credentials\/([^/]+)\/([^/]+)\/test$/);
  if (credTestMatch && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, credTenantId, appId] = credTestMatch;
    const existing = await pool.query(
      "SELECT id FROM app_credentials WHERE tenant_id = $1 AND app_id = $2",
      [credTenantId, appId],
    );
    if (existing.rows.length === 0) return fail(404, "Credential not found", "NOT_FOUND");
    // Placeholder: mark as healthy. Real implementation would call the app's API.
    await pool.query(
      `UPDATE app_credentials SET healthy = true, last_test_at = NOW() WHERE tenant_id = $1 AND app_id = $2`,
      [credTenantId, appId],
    );
    return ok({
      status: "success",
      data: { tenantId: credTenantId, appId, healthy: true, testedAt: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }

  return fail(404, "Not Found", "NOT_FOUND");
}
