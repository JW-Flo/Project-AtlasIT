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
import bcrypt from "bcryptjs";
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
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });
    _pool
      .connect()
      .then((c) => {
        c.release();
      })
      .catch(() => {});
  }
  return _pool;
}
getPool();

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

  // ── CORS preflight (no auth, handle before everything) ──────────────────
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": event.headers?.origin ?? "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-api-key, x-correlation-id, x-internal-api-key, x-request-id, x-tenant-id",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "7200",
      },
      body: "",
    };
  }

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

  // POST /api/v1/auth/token — issue session token (bcrypt password verification + lockout)
  if (path === "/api/v1/auth/token" && method === "POST") {
    const b = body(event) as { email?: string; password?: string; tenantId?: string };
    if (!b.email) return fail(400, "email is required", "VALIDATION_FAILED");
    if (!b.password) return fail(400, "password is required", "VALIDATION_FAILED");

    const pool = getPool();
    // Look up user by email (across all tenants for now; production needs tenantId scoping)
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.status, u.tenant_id, u.password_hash,
              u.failed_login_count, u.locked_until, t.name as tenant_name
       FROM users u JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1 ${b.tenantId ? "AND u.tenant_id = $2" : ""}
       LIMIT 1`,
      b.tenantId ? [b.email, b.tenantId] : [b.email],
    );

    if (result.rows.length === 0) {
      return fail(401, "Invalid credentials", "UNAUTHORIZED");
    }
    const user = result.rows[0];
    if (user.status && user.status !== "active") {
      return fail(403, "Account not active", "FORBIDDEN");
    }

    // Account lockout check
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until).getTime();
      if (lockedUntil > Date.now()) {
        const minutes = Math.ceil((lockedUntil - Date.now()) / 60_000);
        return fail(
          429,
          `Account locked, try again in ${minutes} minute${minutes === 1 ? "" : "s"}`,
          "LOCKED",
        );
      }
    }

    // Password hash must be set going forward
    if (!user.password_hash) {
      return fail(403, "Password not set — contact administrator", "PASSWORD_NOT_SET");
    }

    // Verify password
    const valid = await bcrypt.compare(b.password, user.password_hash);
    if (!valid) {
      const nextCount = (user.failed_login_count ?? 0) + 1;
      if (nextCount >= 5) {
        await pool.query(
          `UPDATE users SET failed_login_count = $1, locked_until = NOW() + interval '15 minutes' WHERE id = $2`,
          [nextCount, user.id],
        );
      } else {
        await pool.query(`UPDATE users SET failed_login_count = $1 WHERE id = $2`, [
          nextCount,
          user.id,
        ]);
      }
      return fail(401, "Invalid credentials", "UNAUTHORIZED");
    }

    // Success — reset lockout counters + update last_login_at
    await pool.query(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1`,
      [user.id],
    );

    // Generate session token and store in DynamoDB sessions table
    const token = crypto.randomBytes(32).toString("hex");
    const ttl = Math.floor(Date.now() / 1000) + 86400; // 24h
    try {
      await svc.sessionRepo.set(
        token,
        {
          userId: user.id,
          tenantId: user.tenant_id,
          email: user.email,
          role: user.role ?? "viewer",
          expiresAt: ttl,
        },
        86400,
      );
    } catch (e) {
      console.error("[core-api] session.set.error", { error: (e as Error).message });
      return fail(500, "Failed to create session", "INTERNAL_ERROR");
    }

    return ok({
      status: "success",
      token,
      userId: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      role: user.role ?? "viewer",
      expiresAt: ttl,
    });
  }

  // POST /api/v1/auth/set-password — bootstrap / reset password (public, admin-token gated)
  if (path === "/api/v1/auth/set-password" && method === "POST") {
    const b = body(event) as { email?: string; newPassword?: string; adminToken?: string };
    if (!b.email || !b.newPassword || !b.adminToken) {
      return fail(400, "email, newPassword, and adminToken are required", "VALIDATION_FAILED");
    }
    const expected = process.env.ADMIN_SETUP_TOKEN;
    if (!expected) {
      return fail(503, "Password reset not configured", "NOT_CONFIGURED");
    }
    // Constant-time comparison to avoid timing oracles
    const a = Buffer.from(b.adminToken);
    const e2 = Buffer.from(expected);
    if (a.length !== e2.length || !crypto.timingSafeEqual(a, e2)) {
      return fail(401, "Invalid admin token", "UNAUTHORIZED");
    }
    if (b.newPassword.length < 12) {
      return fail(400, "newPassword must be at least 12 characters", "VALIDATION_FAILED");
    }

    const pool = getPool();
    const hash = await bcrypt.hash(b.newPassword, 12);
    const updateResult = await pool.query(
      `UPDATE users SET password_hash = $1, failed_login_count = 0, locked_until = NULL
       WHERE email = $2 RETURNING id, email, tenant_id`,
      [hash, b.email],
    );
    if (updateResult.rows.length === 0) {
      return fail(404, "User not found", "NOT_FOUND");
    }
    const u = updateResult.rows[0];
    return ok({
      status: "success",
      userId: u.id,
      email: u.email,
      tenantId: u.tenant_id,
      timestamp: new Date().toISOString(),
    });
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

  // GET /api/v1/directory/users — list synced directory users
  if (path === "/api/v1/directory/users" && method === "GET") {
    const limit = Math.min(parseInt(qs.limit ?? "100", 10) || 100, 500);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;
    const rows = await pool.query(
      `SELECT id, email, external_id, department, title, status, display_name, created_at
       FROM directory_users WHERE tenant_id = $1 ORDER BY email ASC LIMIT $2 OFFSET $3`,
      [auth.tenantId, limit, offset],
    );
    const countRow = await pool.query(
      `SELECT COUNT(*) as cnt FROM directory_users WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    return ok({
      status: "success",
      data: { items: rows.rows, total: parseInt(countRow.rows[0]?.cnt ?? "0", 10) },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/directory/groups — list synced directory groups
  if (path === "/api/v1/directory/groups" && method === "GET") {
    const rows = await pool.query(
      `SELECT g.id, g.name, g.description, g.external_id, g.created_at,
              COUNT(m.user_id) as member_count
       FROM directory_groups g
       LEFT JOIN directory_memberships m ON g.id = m.group_id
       WHERE g.tenant_id = $1
       GROUP BY g.id ORDER BY g.name ASC`,
      [auth.tenantId],
    );
    return ok({
      status: "success",
      data: { items: rows.rows, total: rows.rows.length },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/directory/sync/status — directory sync status per provider
  if (path === "/api/v1/directory/sync/status" && method === "GET") {
    const rows = await pool.query(
      `SELECT provider, status, last_sync_at, created_at FROM directory_connections WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    const userCount = await pool.query(
      `SELECT COUNT(*) as cnt FROM directory_users WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    const groupCount = await pool.query(
      `SELECT COUNT(*) as cnt FROM directory_groups WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    return ok({
      status: "success",
      data: {
        connections: rows.rows,
        userCount: parseInt(userCount.rows[0]?.cnt ?? "0", 10),
        groupCount: parseInt(groupCount.rows[0]?.cnt ?? "0", 10),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/dashboard — consolidated dashboard data for console
  if (path === "/api/v1/dashboard" && method === "GET") {
    try {
      const [tenant, evidenceCount, rulesCount, incidentCount, recentEvents] = await Promise.all([
        pool.query(
          `SELECT id, name, slug, tier, status, industry, created_at FROM tenants WHERE id = $1`,
          [auth.tenantId],
        ),
        pool.query(
          `SELECT COUNT(*) as cnt FROM compliance_evidence WHERE tenant_id = $1`,
          [auth.tenantId],
        ),
        pool.query(
          `SELECT COUNT(*) as cnt, SUM(CASE WHEN enabled THEN 1 ELSE 0 END) as enabled
           FROM automation_rules WHERE tenant_id = $1`,
          [auth.tenantId],
        ),
        pool.query(
          `SELECT COUNT(*) as cnt FROM incidents WHERE tenant_id = $1 AND status IN ('open', 'investigating')`,
          [auth.tenantId],
        ),
        pool.query(
          `SELECT id, type, source, status, created_at FROM events
           WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5`,
          [auth.tenantId],
        ),
      ]);

      return ok({
        status: "success",
        data: {
          tenant: tenant.rows[0] ?? null,
          user: {
            id: auth.userId,
            email: auth.email,
            role: auth.role,
          },
          stats: {
            evidenceCount: parseInt(evidenceCount.rows[0]?.cnt ?? "0", 10),
            automationRulesTotal: parseInt(rulesCount.rows[0]?.cnt ?? "0", 10),
            automationRulesEnabled: parseInt(rulesCount.rows[0]?.enabled ?? "0", 10),
            openIncidents: parseInt(incidentCount.rows[0]?.cnt ?? "0", 10),
          },
          recentEvents: recentEvents.rows,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[core-api] dashboard.error", { error: (e as Error).message });
      return fail(500, "Failed to load dashboard", "INTERNAL_ERROR");
    }
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
    const b = body(event) as {
      name?: string;
      industry?: string;
      status?: string;
      tier?: string;
      config?: unknown;
    };
    const updates: string[] = [];
    const vals: unknown[] = [];
    if (b.name !== undefined) {
      updates.push(`name = $${vals.length + 1}`);
      vals.push(b.name);
    }
    if (b.industry !== undefined) {
      updates.push(`industry = $${vals.length + 1}`);
      vals.push(b.industry);
    }
    if (b.status !== undefined) {
      updates.push(`status = $${vals.length + 1}`);
      vals.push(b.status);
    }
    if (b.tier !== undefined) {
      updates.push(`tier = $${vals.length + 1}`);
      vals.push(b.tier);
    }
    if (b.config !== undefined) {
      updates.push(`config = $${vals.length + 1}`);
      vals.push(JSON.stringify(b.config));
    }
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
        "SELECT id, status FROM events WHERE idempotency_key = $1 AND tenant_id = $2",
        [b.idempotencyKey, b.tenantId],
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
      [
        id,
        b.tenantId,
        b.type,
        b.source,
        b.payload ? JSON.stringify(b.payload) : null,
        b.idempotencyKey ?? null,
      ],
    );
    return ok(
      {
        status: "success",
        data: { id, type: b.type, source: b.source, status: "pending" },
        timestamp: new Date().toISOString(),
      },
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
    const b = body(event) as {
      enabled?: boolean;
      rolloutPct?: number;
      tenantOverrides?: Record<string, boolean>;
    };
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
  // Note: The flag repository uses 'name' as the key identifier, so we accept 'key' as the identifier
  // and ignore the 'name' field (which was confusing). API now only requires 'key'.
  if (path === "/api/v1/flags" && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const b = body(event) as {
      key?: string;
      description?: string;
      enabled?: boolean;
      rolloutPercentage?: number;
      tenantOverrides?: Record<string, boolean>;
    };
    if (!b.key) return fail(400, "key is required", "VALIDATION_FAILED");
    const existing = await svc.flagRepo.get(b.key);
    if (existing) return fail(409, "A flag with this key already exists", "CONFLICT");
    const now = new Date().toISOString();
    const flag = {
      name: b.key,
      enabled: b.enabled ?? true,
      rolloutPct: b.rolloutPercentage ?? 100,
      tenantOverrides: b.tenantOverrides ?? {},
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
      enabled?: boolean;
      rolloutPercentage?: number;
      tenantOverrides?: Record<string, boolean>;
    };
    const updated = {
      name: key,
      enabled: b.enabled ?? existing.enabled,
      rolloutPct: b.rolloutPercentage ?? existing.rolloutPct,
      tenantOverrides: b.tenantOverrides ?? existing.tenantOverrides,
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
    return ok({
      status: "success",
      data: { key, deleted: true },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/flags/:key/evaluate — evaluate flag for given context
  const flagEvaluateMatch = path.match(/^\/api\/v1\/flags\/([^/]+)\/evaluate$/);
  if (flagEvaluateMatch && method === "POST") {
    const [, key] = flagEvaluateMatch;
    const b = body(event) as { tenantId?: string; tenantTier?: string; userId?: string };
    if (!b.tenantId) return fail(400, "tenantId is required", "VALIDATION_FAILED");
    const flag = await svc.flagRepo.get(key);
    if (!flag) return fail(404, "Flag not found", "NOT_FOUND");
    // Simple evaluation logic based on persisted flag fields only.
    let enabled = flag.enabled;
    if (flag.tenantOverrides?.[b.tenantId] !== undefined) {
      enabled = flag.tenantOverrides[b.tenantId];
    }
    return ok({
      status: "success",
      data: { key, enabled, reason: "evaluated" },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/flags/:key/kill — unsupported because killSwitch is not persisted
  const flagKillMatch = path.match(/^\/api\/v1\/flags\/([^/]+)\/kill$/);
  if (flagKillMatch && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, key] = flagKillMatch;
    const flag = await svc.flagRepo.get(key);
    if (!flag) return fail(404, "Flag not found", "NOT_FOUND");
    return fail(
      501,
      "Flag kill switch is not supported by the current flag repository",
      "NOT_IMPLEMENTED",
    );
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
    return ok({
      status: "success",
      data: { id, deleted: true },
      timestamp: new Date().toISOString(),
    });
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
    if (!b.email || !b.tenantId)
      return fail(400, "email and tenantId are required", "VALIDATION_FAILED");
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
    const b = body(event) as {
      tenantId?: string;
      appId?: string;
      credentials?: Record<string, string>;
    };
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
    const encodedCredentials = Buffer.from(JSON.stringify(b.credentials)).toString("base64");
    const result = await pool.query<{ id: string }>(
      `INSERT INTO app_credentials (id, tenant_id, app_id, credentials, connected_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (tenant_id, app_id) DO UPDATE
         SET credentials = EXCLUDED.credentials, updated_at = NOW()
       RETURNING id`,
      [id, b.tenantId, b.appId, encodedCredentials],
    );
    const persistedId = result.rows[0]?.id ?? id;
    return ok(
      {
        status: "success",
        data: { id: persistedId, appId: b.appId, tenantId: b.tenantId },
        timestamp: new Date().toISOString(),
      },
      201,
    );
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
      `SELECT credentials FROM app_credentials WHERE tenant_id = $1 AND app_id = $2`,
      [credTenantId, appId],
    );
    if (result.rows.length === 0) return fail(404, "Credential not found", "NOT_FOUND");
    // SECURITY WARNING: Credentials are only base64-encoded, not encrypted.
    // Do not return raw secrets without proper authorization and audit logging.
    const decoded = JSON.parse(Buffer.from(result.rows[0].credentials, "base64").toString("utf8"));
    return ok({
      status: "success",
      data: { tenantId: credTenantId, appId, credentials: decoded },
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
    const encodedCredentials = Buffer.from(JSON.stringify(b.credentials)).toString("base64");
    await pool.query(
      `UPDATE app_credentials SET credentials = $1, updated_at = NOW() WHERE tenant_id = $2 AND app_id = $3`,
      [encodedCredentials, credTenantId, appId],
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
    await pool.query("DELETE FROM app_credentials WHERE tenant_id = $1 AND app_id = $2", [
      credTenantId,
      appId,
    ]);
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
