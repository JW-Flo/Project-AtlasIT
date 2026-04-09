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

  return fail(404, "Not Found", "NOT_FOUND");
}
