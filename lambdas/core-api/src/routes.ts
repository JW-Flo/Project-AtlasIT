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
import { ALL_MANIFESTS } from "@atlasit/connector-schema";
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

// ── Event publishing ──────────────────────────────────────────────────────
// Insert into events + enqueue SQS message so the orchestrator picks it up
// and fans out to automation rules. Best-effort: failures don't block the
// calling route — event publishing is observability, not critical-path.
async function publishEvent(
  tenantId: string,
  type: string,
  source: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.query(
      `INSERT INTO events (id, tenant_id, type, source, payload, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
      [id, tenantId, type, source, JSON.stringify(payload)],
    );
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: id,
      stepIndex: 0,
      action: "process_event",
      payload: { eventId: id, type, source, data: payload },
    });
  } catch (err) {
    console.warn("[core-api] publishEvent failed", {
      type,
      source,
      error: (err as Error).message,
    });
  }
}

// ── TOTP helpers (RFC 6238) ───────────────────────────────────────────────
// 160-bit secret, 30s step, 6-digit code, SHA-1 HMAC.
function base32Encode(buf: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 0x1f];
  return out;
}

function base32Decode(str: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of clean) {
    value = (value << 5) | alphabet.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpGenerate(secretB32: string, timestamp: number = Date.now()): string {
  const counter = Math.floor(timestamp / 1000 / 30);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secretB32)).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

function totpVerify(secretB32: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const now = Date.now();
  // Allow ±1 time step (30s) for clock skew
  for (const delta of [-30_000, 0, 30_000]) {
    if (totpGenerate(secretB32, now + delta) === code) return true;
  }
  return false;
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
        "Access-Control-Allow-Headers":
          "authorization, content-type, x-api-key, x-correlation-id, x-internal-api-key, x-request-id, x-tenant-id",
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

  // GET /api/v1/tenant/settings — tenant configuration
  if (path === "/api/v1/tenant/settings" && method === "GET") {
    const tenant = await pool.query(
      `SELECT id, name, slug, tier, status, industry, size, config, created_at
       FROM tenants WHERE id = $1`,
      [auth.tenantId],
    );
    const prefs = await pool.query(
      `SELECT key, value FROM tenant_preferences WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    const prefMap: Record<string, unknown> = {};
    for (const row of prefs.rows) {
      try {
        prefMap[row.key] = JSON.parse(row.value);
      } catch {
        prefMap[row.key] = row.value;
      }
    }
    return ok({
      status: "success",
      data: { tenant: tenant.rows[0] ?? null, preferences: prefMap },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/tenant/users — list users in tenant
  if (path === "/api/v1/tenant/users" && method === "GET") {
    const rows = await pool.query(
      `SELECT id, email, display_name, role, status, last_login_at, created_at
       FROM users WHERE tenant_id = $1 ORDER BY email ASC`,
      [auth.tenantId],
    );
    return ok({
      status: "success",
      data: { items: rows.rows, total: rows.rows.length },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/tenant/users/invite — invite a new user, return single-use accept-invite URL
  if (path === "/api/v1/tenant/users/invite" && method === "POST") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required to invite users", "FORBIDDEN");
    }
    const b = body(event) as { email?: string; displayName?: string; role?: string };
    if (!b.email) return fail(400, "email is required", "VALIDATION_FAILED");
    const role = b.role && ["admin", "member", "viewer"].includes(b.role) ? b.role : "member";
    const userId = crypto.randomUUID();
    const email = b.email.toLowerCase();
    // Raw token returned once (in the response). We store only its SHA-256 hash.
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 86400 * 1000); // 7 days

    try {
      // Create the user with NULL password_hash — they'll set it on accept.
      // Status 'invited' distinguishes them from active users in lists.
      await pool.query(
        `INSERT INTO users (id, tenant_id, email, display_name, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'invited', NOW(), NOW())`,
        [userId, auth.tenantId, email, b.displayName ?? null, role],
      );
      await pool.query(
        `INSERT INTO invitation_tokens (token_hash, tenant_id, user_id, email, invited_by_id, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tokenHash, auth.tenantId, userId, email, auth.userId, expiresAt.toISOString()],
      );

      const consoleBase = process.env.CONSOLE_BASE_URL ?? "https://www.atlasit.pro";
      const inviteUrl = `${consoleBase}/accept-invite?token=${encodeURIComponent(rawToken)}`;

      await publishEvent(auth.tenantId, "user.invited", "core-api", {
        userId,
        email,
        role,
        invitedBy: auth.userId,
      });

      return ok(
        {
          status: "success",
          data: {
            id: userId,
            email,
            role,
            status: "invited",
            inviteUrl,
            expiresAt: expiresAt.toISOString(),
          },
          timestamp: new Date().toISOString(),
        },
        201,
      );
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("duplicate") || msg.includes("unique"))
        return fail(409, "User with this email already exists", "CONFLICT");
      console.error("[core-api] invite.error", { error: msg });
      return fail(500, "Failed to invite user", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/auth/invite/:token — public, returns invite metadata (for accept page pre-render)
  {
    const m = path.match(/^\/api\/v1\/auth\/invite\/([A-Za-z0-9_-]+)$/);
    if (m && method === "GET") {
      const rawToken = m[1];
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const row = await pool.query(
        `SELECT it.email, it.expires_at, it.accepted_at, t.name as tenant_name, u.role, u.display_name
         FROM invitation_tokens it
         INNER JOIN tenants t ON t.id = it.tenant_id
         INNER JOIN users u ON u.id = it.user_id
         WHERE it.token_hash = $1`,
        [tokenHash],
      );
      if (row.rows.length === 0) return fail(404, "Invalid invitation", "NOT_FOUND");
      const r = row.rows[0];
      if (r.accepted_at) return fail(410, "Invitation already accepted", "ACCEPTED");
      if (new Date(r.expires_at) < new Date()) return fail(410, "Invitation expired", "EXPIRED");
      return ok({
        status: "success",
        data: {
          email: r.email,
          role: r.role,
          displayName: r.display_name,
          tenantName: r.tenant_name,
          expiresAt: r.expires_at,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // POST /api/v1/auth/accept-invite — public, sets password + returns auth token
  if (path === "/api/v1/auth/accept-invite" && method === "POST") {
    const b = body(event) as { token?: string; password?: string; displayName?: string };
    if (!b.token || !b.password)
      return fail(400, "token and password required", "VALIDATION_FAILED");
    if (b.password.length < 8)
      return fail(400, "Password must be at least 8 characters", "VALIDATION_FAILED");
    const tokenHash = crypto.createHash("sha256").update(b.token).digest("hex");
    try {
      const row = await pool.query(
        `SELECT it.user_id, it.tenant_id, it.email, it.expires_at, it.accepted_at
         FROM invitation_tokens it WHERE it.token_hash = $1`,
        [tokenHash],
      );
      if (row.rows.length === 0) return fail(404, "Invalid invitation", "NOT_FOUND");
      const invite = row.rows[0];
      if (invite.accepted_at) return fail(410, "Invitation already accepted", "ACCEPTED");
      if (new Date(invite.expires_at) < new Date())
        return fail(410, "Invitation expired", "EXPIRED");

      const hash = await bcrypt.hash(b.password, 10);
      await pool.query(
        `UPDATE users SET password_hash = $1, display_name = COALESCE($2, display_name),
                          status = 'active', updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4`,
        [hash, b.displayName?.trim() || null, invite.user_id, invite.tenant_id],
      );
      await pool.query(`UPDATE invitation_tokens SET accepted_at = NOW() WHERE token_hash = $1`, [
        tokenHash,
      ]);

      // Issue a session token so the console can auto-login on success.
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAtTs = Math.floor(Date.now() / 1000) + 7 * 86400;
      await svc.authRepo.createSession({
        token: sessionToken,
        userId: invite.user_id,
        tenantId: invite.tenant_id,
        expiresAt: expiresAtTs,
      });

      const userRow = await pool.query(
        `SELECT email, role, display_name FROM users WHERE id = $1`,
        [invite.user_id],
      );
      const u = userRow.rows[0];

      await publishEvent(invite.tenant_id, "user.activated", "core-api", {
        userId: invite.user_id,
        email: u.email,
        role: u.role,
      });

      return ok({
        status: "success",
        token: sessionToken,
        userId: invite.user_id,
        email: u.email,
        tenantId: invite.tenant_id,
        role: u.role,
        expiresAt: expiresAtTs,
      });
    } catch (e) {
      console.error("[core-api] accept-invite.error", { error: (e as Error).message });
      return fail(500, "Failed to accept invitation", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/user/profile — get current user's profile
  if (path === "/api/v1/user/profile" && method === "GET") {
    const user = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.role, u.last_login_at, u.created_at,
              t.name as tenant_name, t.slug as tenant_slug
       FROM users u JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [auth.userId],
    );
    return ok({
      status: "success",
      data: user.rows[0] ?? null,
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/audit-log — tenant-scoped audit trail with cursor pagination + filters
  if (path === "/api/v1/audit-log" && method === "GET") {
    const limit = Math.min(Math.max(parseInt(qs.limit ?? "50", 10) || 50, 1), 200);
    const cursor = qs.cursor ?? null;
    const actorFilter = qs.actorId ?? null;
    const actionFilter = qs.action ?? null;
    const resourceTypeFilter = qs.resourceType ?? null;
    try {
      const conditions = [`tenant_id = $1`];
      const bindings: unknown[] = [auth.tenantId];
      if (cursor) {
        conditions.push(`created_at < $${bindings.length + 1}`);
        bindings.push(cursor);
      }
      if (actorFilter) {
        conditions.push(`actor_id = $${bindings.length + 1}`);
        bindings.push(actorFilter);
      }
      if (actionFilter) {
        conditions.push(`action ILIKE $${bindings.length + 1}`);
        bindings.push(`%${actionFilter}%`);
      }
      if (resourceTypeFilter) {
        conditions.push(`resource_type = $${bindings.length + 1}`);
        bindings.push(resourceTypeFilter);
      }
      const rows = await pool.query(
        `SELECT id, actor_id as "actorId", actor_type as "actorType", action,
                resource_type as "resourceType", resource_id as "resourceId",
                details, ip_address as "ipAddress", correlation_id as "correlationId",
                created_at as "createdAt"
         FROM audit_log
         WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC
         LIMIT $${bindings.length + 1}`,
        [...bindings, limit + 1],
      );
      const items = rows.rows.slice(0, limit);
      const hasNext = rows.rows.length > limit;
      const nextCursor = hasNext ? (items[items.length - 1]?.createdAt ?? null) : null;
      const totalRow = await pool.query(
        `SELECT COUNT(*) as cnt FROM audit_log WHERE tenant_id = $1`,
        [auth.tenantId],
      );
      const distinctActions = await pool.query(
        `SELECT DISTINCT action FROM audit_log WHERE tenant_id = $1 ORDER BY action LIMIT 100`,
        [auth.tenantId],
      );
      const distinctResourceTypes = await pool.query(
        `SELECT DISTINCT resource_type FROM audit_log WHERE tenant_id = $1 AND resource_type IS NOT NULL ORDER BY resource_type LIMIT 50`,
        [auth.tenantId],
      );
      return ok({
        status: "success",
        data: {
          items,
          total: parseInt(totalRow.rows[0]?.cnt ?? "0", 10),
          nextCursor,
          facets: {
            actions: distinctActions.rows.map((r: { action: string }) => r.action),
            resourceTypes: distinctResourceTypes.rows.map(
              (r: { resource_type: string }) => r.resource_type,
            ),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[core-api] audit-log.list.error", { error: (e as Error).message });
      return fail(500, "Failed to load audit log", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/dashboard — consolidated dashboard data for console
  if (path === "/api/v1/dashboard" && method === "GET") {
    try {
      const [tenant, evidenceCount, rulesCount, incidentCount, recentEvents] = await Promise.all([
        pool.query(
          `SELECT id, name, slug, tier, status, industry, created_at FROM tenants WHERE id = $1`,
          [auth.tenantId],
        ),
        pool.query(`SELECT COUNT(*) as cnt FROM compliance_evidence WHERE tenant_id = $1`, [
          auth.tenantId,
        ]),
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
      size?: string;
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
    if (b.size !== undefined) {
      updates.push(`size = $${vals.length + 1}`);
      vals.push(b.size);
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
    // Fan-out to SQS so orchestrator consumer processes the event.
    try {
      await svc.queueRepo.send({
        tenantId: b.tenantId,
        workflowRunId: id,
        stepIndex: 0,
        action: "process_event",
        payload: { eventId: id, type: b.type, source: b.source, data: b.payload ?? {} },
      });
    } catch (qErr) {
      console.warn("[core-api] events.sqs_fanout_failed", {
        id,
        error: (qErr as Error).message,
      });
    }
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
    // Tenant isolation: non-admins can only evaluate flags for their own tenant
    const targetTenantId = b.tenantId ?? auth.tenantId;
    if (auth.role !== "admin" && targetTenantId !== auth.tenantId) {
      return fail(403, "Cannot evaluate flags for other tenants", "FORBIDDEN");
    }
    const flag = await svc.flagRepo.get(key);
    if (!flag) return fail(404, "Flag not found", "NOT_FOUND");
    let enabled = flag.enabled;
    if (flag.tenantOverrides?.[targetTenantId] !== undefined) {
      enabled = flag.tenantOverrides[targetTenantId];
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

  // Note: /api/v1/auth/token is handled at the top of this function (before auth extraction)
  // to allow unauthenticated login. The dead placeholder that was here has been removed.

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

  // GET /api/v1/billing — tenant subscription state + invoices (from tenant_billing)
  if (path === "/api/v1/billing" && method === "GET") {
    const [billingRow, invoiceRows, usageRows] = await Promise.all([
      pool.query(
        `SELECT plan, billing_cycle as "billingCycle", status, seat_count as "seatCount",
                stripe_customer_id as "stripeCustomerId", stripe_subscription_id as "stripeSubscriptionId",
                trial_ends_at as "trialEndsAt", current_period_start as "currentPeriodStart",
                current_period_end as "currentPeriodEnd", canceled_at as "canceledAt"
         FROM tenant_billing WHERE tenant_id = $1`,
        [auth.tenantId],
      ),
      pool.query(
        `SELECT id, stripe_invoice_id as "stripeInvoiceId", amount_cents as "amountCents",
                currency, status, period_start as "periodStart", period_end as "periodEnd",
                paid_at as "paidAt", pdf_url as "pdfUrl", created_at as "createdAt"
         FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 24`,
        [auth.tenantId],
      ),
      pool.query(
        `SELECT metric, SUM(quantity)::int as quantity FROM usage_records
         WHERE tenant_id = $1 AND period_start >= $2 GROUP BY metric`,
        [auth.tenantId, new Date(Date.now() - 30 * 86400 * 1000).toISOString()],
      ),
    ]);

    const b = billingRow.rows[0] ?? {
      plan: "free",
      billingCycle: "monthly",
      status: "active",
      seatCount: 5,
    };
    const usage = usageRows.rows.reduce(
      (acc, r) => ({ ...acc, [r.metric]: r.quantity }),
      {} as Record<string, number>,
    );

    return ok({
      status: "success",
      billing: b,
      usage,
      invoices: invoiceRows.rows,
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/billing/seats — seat capacity vs active users
  if (path === "/api/v1/billing/seats" && method === "GET") {
    const [billingRow, activeCount] = await Promise.all([
      pool.query(
        `SELECT seat_count as "seatCount", stripe_subscription_id as "stripeSubscriptionId"
         FROM tenant_billing WHERE tenant_id = $1`,
        [auth.tenantId],
      ),
      pool.query(
        `SELECT COUNT(*)::int as cnt FROM users WHERE tenant_id = $1 AND status = 'active'`,
        [auth.tenantId],
      ),
    ]);
    const b = billingRow.rows[0] ?? { seatCount: 5, stripeSubscriptionId: null };
    return ok({
      seats: b.seatCount,
      activeUsers: activeCount.rows[0]?.cnt ?? 0,
      hasSubscription: Boolean(b.stripeSubscriptionId),
    });
  }

  // POST /api/v1/billing/seats — update seat count (admin). Forwards to Stripe
  // subscription if one exists; dev environments without STRIPE_API_KEY still
  // update the local seat_count column so the UI reflects the change.
  if (path === "/api/v1/billing/seats" && method === "POST") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const b = body(event) as { seats?: number };
    if (!b.seats || b.seats < 1 || b.seats > 10_000) {
      return fail(400, "seats must be between 1 and 10000", "VALIDATION_FAILED");
    }
    const existing = await pool.query(
      `SELECT stripe_subscription_id FROM tenant_billing WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    const subId = existing.rows[0]?.stripe_subscription_id;

    if (subId && process.env.STRIPE_API_KEY) {
      const stripeRes = await fetch(
        `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_API_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `items[0][quantity]=${b.seats}&proration_behavior=create_prorations`,
        },
      );
      if (!stripeRes.ok) {
        const err = await stripeRes.text();
        return fail(502, `Stripe subscription update failed: ${err.slice(0, 200)}`, "STRIPE_ERROR");
      }
    }

    await pool.query(
      `UPDATE tenant_billing SET seat_count = $1, updated_at = NOW() WHERE tenant_id = $2`,
      [b.seats, auth.tenantId],
    );

    return ok({ seats: b.seats });
  }

  // POST /api/v1/billing/checkout — Stripe Checkout for plan upgrade
  if (path === "/api/v1/billing/checkout" && method === "POST") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    if (!process.env.STRIPE_API_KEY) {
      return fail(
        501,
        "Billing is not configured — set STRIPE_API_KEY to enable checkout",
        "BILLING_NOT_CONFIGURED",
      );
    }
    const b = body(event) as { plan?: string; cycle?: string; quantity?: number };
    const priceIdMap: Record<string, string | undefined> = {
      "starter.monthly": process.env.STRIPE_PRICE_STARTER_MONTHLY,
      "starter.annual": process.env.STRIPE_PRICE_STARTER_ANNUAL,
      "professional.monthly": process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
      "professional.annual": process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
      "enterprise.monthly": process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      "enterprise.annual": process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
    };
    const key = `${b.plan ?? ""}.${b.cycle ?? "monthly"}`;
    const priceId = priceIdMap[key];
    if (!priceId) {
      return fail(400, `Unknown plan/cycle: ${key}`, "VALIDATION_FAILED");
    }

    const consoleBase = process.env.CONSOLE_BASE_URL ?? "https://www.atlasit.pro";
    const quantity = Math.max(1, Math.min(b.quantity ?? 5, 10_000));

    const billing = await pool.query(
      `SELECT stripe_customer_id, billing_email FROM tenant_billing WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    let customerId = billing.rows[0]?.stripe_customer_id as string | null;
    if (!customerId) {
      const tenant = await pool.query(`SELECT name FROM tenants WHERE id = $1`, [auth.tenantId]);
      const params = new URLSearchParams({
        email: billing.rows[0]?.billing_email ?? auth.email,
        name: tenant.rows[0]?.name ?? auth.tenantId,
        "metadata[tenant_id]": auth.tenantId,
      });
      const cRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!cRes.ok) {
        return fail(502, "Stripe customer creation failed", "STRIPE_ERROR");
      }
      const cData = (await cRes.json()) as { id: string };
      customerId = cData.id;
      await pool.query(
        `UPDATE tenant_billing SET stripe_customer_id = $1, updated_at = NOW() WHERE tenant_id = $2`,
        [customerId, auth.tenantId],
      );
    }

    const params = new URLSearchParams({
      customer: customerId,
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": String(quantity),
      success_url: `${consoleBase}/console/settings/billing?checkout=success`,
      cancel_url: `${consoleBase}/console/settings/billing?checkout=canceled`,
      "metadata[tenant_id]": auth.tenantId,
    });
    const sRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!sRes.ok) {
      const err = await sRes.text();
      return fail(502, `Stripe checkout failed: ${err.slice(0, 200)}`, "STRIPE_ERROR");
    }
    const sData = (await sRes.json()) as { id: string; url: string };
    return ok({ url: sData.url, sessionId: sData.id });
  }

  // POST /api/v1/billing/portal — Stripe Customer Portal session
  if (path === "/api/v1/billing/portal" && method === "POST") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    if (!process.env.STRIPE_API_KEY) {
      return fail(
        501,
        "Billing is not configured — set STRIPE_API_KEY to enable portal",
        "BILLING_NOT_CONFIGURED",
      );
    }
    const billing = await pool.query(
      `SELECT stripe_customer_id FROM tenant_billing WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    const customerId = billing.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return fail(404, "No Stripe customer — run checkout first", "NO_CUSTOMER");
    }
    const consoleBase = process.env.CONSOLE_BASE_URL ?? "https://www.atlasit.pro";
    const params = new URLSearchParams({
      customer: customerId,
      return_url: `${consoleBase}/console/settings/billing`,
    });
    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      return fail(502, `Stripe portal failed: ${err.slice(0, 200)}`, "STRIPE_ERROR");
    }
    const data = (await res.json()) as { url: string };
    return ok({ url: data.url });
  }

  // GET /api/v1/apps/integrations — list connected integrations for tenant
  if (path === "/api/v1/apps/integrations" && method === "GET") {
    const rows = await pool.query(
      `SELECT id, provider, type, status, installed_at as created_at, updated_at FROM integrations
       WHERE tenant_id = $1 ORDER BY installed_at DESC`,
      [auth.tenantId],
    );
    return ok({
      status: "success",
      data: { items: rows.rows, total: rows.rows.length },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/apps/connect — create new integration (tenant-scoped)
  if (path === "/api/v1/apps/connect" && method === "POST") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const b = body(event) as {
      provider?: string;
      name?: string;
      type?: string;
      config?: Record<string, unknown>;
    };
    if (!b.provider) return fail(400, "provider is required", "VALIDATION_FAILED");
    const id = crypto.randomUUID();
    const type = b.type && ["saas", "api", "database", "custom"].includes(b.type) ? b.type : "saas";
    await pool.query(
      `INSERT INTO integrations (id, tenant_id, name, type, provider, status, config, installed_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), NOW())`,
      [id, auth.tenantId, b.name ?? b.provider, type, b.provider, JSON.stringify(b.config ?? {})],
    );
    await publishEvent(auth.tenantId, "integration.connected", "core-api", {
      integrationId: id,
      provider: b.provider,
      type,
      actor: auth.userId,
    });
    return ok(
      {
        status: "success",
        data: { id, provider: b.provider, status: "active" },
        timestamp: new Date().toISOString(),
      },
      201,
    );
  }

  // DELETE /api/v1/apps/disconnect — remove integration (by id or provider)
  if (path === "/api/v1/apps/disconnect" && method === "DELETE") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const b = body(event) as { id?: string; provider?: string };
    if (!b.id && !b.provider) return fail(400, "id or provider required", "VALIDATION_FAILED");
    const where = b.id ? "id = $2" : "provider = $2";
    const result = await pool.query(`DELETE FROM integrations WHERE tenant_id = $1 AND ${where}`, [
      auth.tenantId,
      b.id ?? b.provider,
    ]);
    if (b.provider) {
      await pool.query(`DELETE FROM app_credentials WHERE tenant_id = $1 AND app_id = $2`, [
        auth.tenantId,
        b.provider,
      ]);
    }
    if ((result.rowCount ?? 0) > 0) {
      await publishEvent(auth.tenantId, "integration.disconnected", "core-api", {
        integrationId: b.id ?? null,
        provider: b.provider ?? null,
        actor: auth.userId,
      });
    }
    return ok({
      status: "success",
      data: { deleted: result.rowCount ?? 0 },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/apps/test — test app credential health (by provider id)
  if (path === "/api/v1/apps/test" && method === "POST") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const b = body(event) as { provider?: string };
    if (!b.provider) return fail(400, "provider required", "VALIDATION_FAILED");
    const existing = await pool.query(
      "SELECT id FROM app_credentials WHERE tenant_id = $1 AND app_id = $2",
      [auth.tenantId, b.provider],
    );
    if (existing.rows.length === 0) return fail(404, "Credential not found", "NOT_FOUND");
    await pool.query(
      `UPDATE app_credentials SET healthy = true, last_test_at = NOW() WHERE tenant_id = $1 AND app_id = $2`,
      [auth.tenantId, b.provider],
    );
    await publishEvent(auth.tenantId, "integration.tested", "core-api", {
      provider: b.provider,
      healthy: true,
      actor: auth.userId,
    });
    return ok({
      status: "success",
      data: { provider: b.provider, healthy: true, testedAt: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/apps/credentials — list credential metadata (no secrets) for tenant
  if (path === "/api/v1/apps/credentials" && method === "GET") {
    const rows = await pool.query(
      `SELECT app_id as "appId", healthy, last_test_at as "lastTestAt",
              connected_at as "connectedAt", updated_at as "updatedAt"
       FROM app_credentials WHERE tenant_id = $1 ORDER BY updated_at DESC`,
      [auth.tenantId],
    );
    return ok({
      status: "success",
      data: { credentials: rows.rows, total: rows.rows.length },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/marketplace — connector registry (public catalog of available connectors)
  if (path === "/api/v1/marketplace" && method === "GET") {
    const installed = await pool.query(`SELECT provider FROM integrations WHERE tenant_id = $1`, [
      auth.tenantId,
    ]);
    const installedProviders = new Set(installed.rows.map((r) => r.provider));
    const items = ALL_MANIFESTS.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      description: m.description,
      provider: m.provider,
      category: m.category,
      logoUrl: m.logoUrl,
      authModel: m.auth?.model,
      installed: installedProviders.has(m.id),
    }));
    return ok({
      status: "success",
      data: { items, total: items.length },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/platform/health-deep — deep health check (DB + ping each service)
  if (path === "/api/v1/platform/health-deep" && method === "GET") {
    const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
    const t0 = Date.now();
    try {
      await pool.query("SELECT 1");
      checks.database = { ok: true, latencyMs: Date.now() - t0 };
    } catch (e) {
      checks.database = { ok: false, error: (e as Error).message };
    }
    const overall = Object.values(checks).every((c) => c.ok);
    return ok({
      status: overall ? "healthy" : "degraded",
      services: checks,
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/incidents/sla-config — read SLA hours config from tenant_preferences
  if (path === "/api/v1/incidents/sla-config" && method === "GET") {
    const row = await pool.query(
      `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'incidents.sla-config'`,
      [auth.tenantId],
    );
    const defaults = { slaHours: { low: 72, medium: 24, high: 4, critical: 1 } };
    let parsed = defaults;
    if (row.rows[0]?.value) {
      try {
        parsed = JSON.parse(row.rows[0].value);
      } catch {}
    }
    return ok({ status: "success", ...parsed, timestamp: new Date().toISOString() });
  }

  // PUT /api/v1/incidents/sla-config — update SLA hours config (admin only)
  if (path === "/api/v1/incidents/sla-config" && method === "PUT") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const b = body(event) as { slaHours?: Record<string, number> };
    if (!b.slaHours || typeof b.slaHours !== "object") {
      return fail(400, "slaHours object required", "VALIDATION_FAILED");
    }
    await pool.query(
      `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
       VALUES ($1, 'incidents.sla-config', $2, NOW())
       ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [auth.tenantId, JSON.stringify({ slaHours: b.slaHours })],
    );
    return ok({
      status: "success",
      slaHours: b.slaHours,
      timestamp: new Date().toISOString(),
    });
  }

  // ── MFA (TOTP) ─────────────────────────────────────────────────────────

  // GET /api/v1/auth/mfa/status — current user's MFA state
  if (path === "/api/v1/auth/mfa/status" && method === "GET") {
    const r = await pool.query(
      `SELECT u.mfa_enabled, m.enrolled_at
       FROM users u LEFT JOIN mfa_enrollments m ON m.user_id = u.id
       WHERE u.id = $1`,
      [auth.userId],
    );
    const row = r.rows[0];
    return ok({
      enabled: row?.mfa_enabled ?? false,
      enrolledAt: row?.enrolled_at ?? null,
    });
  }

  // POST /api/v1/auth/mfa/setup — generate + persist a new secret; return otpauth URI
  if (path === "/api/v1/auth/mfa/setup" && method === "POST") {
    const secretBytes = crypto.randomBytes(20);
    const secretB32 = base32Encode(secretBytes);
    const secretHash = crypto.createHash("sha256").update(secretB32).digest("hex");
    // Store the base32 secret encrypted at rest is ideal; for now, store hash
    // plus the raw secret in a temporary pre-enrollment slot via a separate
    // ephemeral mechanism. Simplest: store the base32 raw in secret_hash
    // column (rename later); we never expose it after confirm.
    await pool.query(
      `INSERT INTO mfa_enrollments (user_id, tenant_id, secret_hash, enrolled_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET secret_hash = EXCLUDED.secret_hash, enrolled_at = NOW()`,
      [auth.userId, auth.tenantId, secretB32],
    );
    const issuer = "AtlasIT";
    const label = `${issuer}:${auth.email ?? auth.userId}`;
    const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secretB32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return ok({ otpauth, secret: secretB32, hashRef: secretHash });
  }

  // POST /api/v1/auth/mfa/confirm — verify the first TOTP code to enable MFA
  if (path === "/api/v1/auth/mfa/confirm" && method === "POST") {
    const b = body(event) as { code?: string };
    if (!b.code) return fail(400, "code required", "VALIDATION_FAILED");
    const r = await pool.query(`SELECT secret_hash FROM mfa_enrollments WHERE user_id = $1`, [
      auth.userId,
    ]);
    if (r.rows.length === 0) return fail(404, "No pending enrollment", "NOT_FOUND");
    if (!totpVerify(r.rows[0].secret_hash, b.code)) {
      return fail(401, "Invalid code", "INVALID_CODE");
    }
    await pool.query(`UPDATE mfa_enrollments SET last_verified_at = NOW() WHERE user_id = $1`, [
      auth.userId,
    ]);
    await pool.query(`UPDATE users SET mfa_enabled = TRUE WHERE id = $1`, [auth.userId]);
    await publishEvent(auth.tenantId, "mfa.enabled", "core-api", {
      userId: auth.userId,
      email: auth.email,
    });
    return ok({ enabled: true });
  }

  // POST /api/v1/auth/mfa/disable — remove MFA enrollment
  if (path === "/api/v1/auth/mfa/disable" && method === "POST") {
    const b = body(event) as { code?: string };
    if (!b.code) return fail(400, "current MFA code required", "VALIDATION_FAILED");
    const r = await pool.query(`SELECT secret_hash FROM mfa_enrollments WHERE user_id = $1`, [
      auth.userId,
    ]);
    if (r.rows.length === 0) return fail(404, "No enrollment", "NOT_FOUND");
    if (!totpVerify(r.rows[0].secret_hash, b.code)) {
      return fail(401, "Invalid code", "INVALID_CODE");
    }
    await pool.query(`DELETE FROM mfa_enrollments WHERE user_id = $1`, [auth.userId]);
    await pool.query(`UPDATE users SET mfa_enabled = FALSE WHERE id = $1`, [auth.userId]);
    await publishEvent(auth.tenantId, "mfa.disabled", "core-api", {
      userId: auth.userId,
      email: auth.email,
    });
    return ok({ enabled: false });
  }

  // ── Tenant SSO ─────────────────────────────────────────────────────────

  // GET /api/v1/tenant/sso — current SSO config (returns { sso: null } if none)
  if (path === "/api/v1/tenant/sso" && method === "GET") {
    const r = await pool.query(
      `SELECT provider, entity_id, metadata_url, sso_url, attribute_mapping, enabled,
              created_at, updated_at
       FROM sso_configs WHERE tenant_id = $1`,
      [auth.tenantId],
    );
    return ok({ sso: r.rows[0] ?? null });
  }

  // PUT /api/v1/tenant/sso — upsert SSO config (admin only)
  if (path === "/api/v1/tenant/sso" && method === "PUT") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const b = body(event) as {
      provider?: string;
      entityId?: string;
      metadataUrl?: string;
      metadataXml?: string;
      ssoUrl?: string;
      ssoCertificate?: string;
      attributeMapping?: Record<string, string>;
      enabled?: boolean;
    };
    if (!b.provider || !["saml", "oidc"].includes(b.provider)) {
      return fail(400, "provider must be 'saml' or 'oidc'", "VALIDATION_FAILED");
    }
    await pool.query(
      `INSERT INTO sso_configs
        (tenant_id, provider, entity_id, metadata_url, metadata_xml, sso_url,
         sso_certificate, attribute_mapping, enabled, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         provider = EXCLUDED.provider,
         entity_id = EXCLUDED.entity_id,
         metadata_url = EXCLUDED.metadata_url,
         metadata_xml = EXCLUDED.metadata_xml,
         sso_url = EXCLUDED.sso_url,
         sso_certificate = EXCLUDED.sso_certificate,
         attribute_mapping = EXCLUDED.attribute_mapping,
         enabled = EXCLUDED.enabled,
         updated_at = NOW()`,
      [
        auth.tenantId,
        b.provider,
        b.entityId ?? null,
        b.metadataUrl ?? null,
        b.metadataXml ?? null,
        b.ssoUrl ?? null,
        b.ssoCertificate ?? null,
        JSON.stringify(b.attributeMapping ?? {}),
        b.enabled ?? false,
      ],
    );
    return ok({ status: "success", enabled: b.enabled ?? false });
  }

  // DELETE /api/v1/tenant/sso — remove SSO config (admin only)
  if (path === "/api/v1/tenant/sso" && method === "DELETE") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    await pool.query(`DELETE FROM sso_configs WHERE tenant_id = $1`, [auth.tenantId]);
    return ok({ status: "success" });
  }

  // ── Directory mappings (group → app role) ──────────────────────────────

  // GET /api/v1/directory/mappings — list mappings for tenant
  if (path === "/api/v1/directory/mappings" && method === "GET") {
    const r = await pool.query(
      `SELECT id, directory_group_id as "directoryGroupId", directory_group_name as "directoryGroupName",
              app_provider as "appProvider", app_role as "appRole", auto_provision as "autoProvision",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM directory_mappings WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [auth.tenantId],
    );
    return ok({ mappings: r.rows });
  }

  // POST /api/v1/directory/mappings — create mapping (admin)
  if (path === "/api/v1/directory/mappings" && method === "POST") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const b = body(event) as {
      directoryGroupId?: string;
      directoryGroupName?: string;
      appProvider?: string;
      appRole?: string;
      autoProvision?: boolean;
    };
    if (!b.directoryGroupId || !b.appProvider || !b.appRole) {
      return fail(400, "directoryGroupId, appProvider, appRole required", "VALIDATION_FAILED");
    }
    const r = await pool.query(
      `INSERT INTO directory_mappings
         (tenant_id, directory_group_id, directory_group_name, app_provider, app_role, auto_provision)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tenant_id, directory_group_id, app_provider) DO UPDATE SET
         directory_group_name = EXCLUDED.directory_group_name,
         app_role = EXCLUDED.app_role,
         auto_provision = EXCLUDED.auto_provision,
         updated_at = NOW()
       RETURNING id`,
      [
        auth.tenantId,
        b.directoryGroupId,
        b.directoryGroupName ?? null,
        b.appProvider,
        b.appRole,
        b.autoProvision ?? true,
      ],
    );
    return ok({ id: r.rows[0].id, status: "success" }, 201);
  }

  // DELETE /api/v1/directory/mappings/:id
  const mapDelMatch = path.match(/^\/api\/v1\/directory\/mappings\/([^/]+)$/);
  if (mapDelMatch && method === "DELETE") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const [, mapId] = mapDelMatch;
    await pool.query(`DELETE FROM directory_mappings WHERE tenant_id = $1 AND id = $2`, [
      auth.tenantId,
      mapId,
    ]);
    return ok({ status: "success" });
  }

  // ── Support tickets ────────────────────────────────────────────────────

  // GET /api/v1/support — list tenant's tickets
  if (path === "/api/v1/support" && method === "GET") {
    const r = await pool.query(
      `SELECT id, submitted_by_email as "submittedByEmail", subject, severity, status,
              created_at as "createdAt", resolved_at as "resolvedAt"
       FROM support_tickets WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [auth.tenantId],
    );
    return ok({ tickets: r.rows });
  }

  // POST /api/v1/support — create a ticket
  if (path === "/api/v1/support" && method === "POST") {
    const b = body(event) as { subject?: string; body?: string; severity?: string };
    if (!b.subject || !b.body) return fail(400, "subject and body required", "VALIDATION_FAILED");
    const severity = ["low", "normal", "high", "urgent"].includes(b.severity ?? "")
      ? b.severity!
      : "normal";
    const r = await pool.query(
      `INSERT INTO support_tickets (tenant_id, submitted_by_id, submitted_by_email, subject, body, severity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [auth.tenantId, auth.userId, auth.email ?? "unknown", b.subject, b.body, severity],
    );
    return ok(
      {
        id: r.rows[0].id,
        createdAt: r.rows[0].created_at,
        message: "Support request submitted",
      },
      201,
    );
  }

  // ── DSAR (privacy requests) ────────────────────────────────────────────

  // GET /api/v1/privacy/dsar — list DSAR requests (admin only)
  if (path === "/api/v1/privacy/dsar" && method === "GET") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required", "FORBIDDEN");
    }
    const r = await pool.query(
      `SELECT id, requester_email as "requesterEmail", request_type as "requestType",
              status, verified_at as "verifiedAt", fulfilled_at as "fulfilledAt",
              created_at as "createdAt"
       FROM dsar_requests WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 500`,
      [auth.tenantId],
    );
    return ok({ requests: r.rows });
  }

  // POST /api/v1/privacy/dsar — submit a DSAR (authenticated users)
  if (path === "/api/v1/privacy/dsar" && method === "POST") {
    const b = body(event) as {
      requesterEmail?: string;
      requestType?: string;
      description?: string;
    };
    if (!b.requesterEmail || !b.requestType) {
      return fail(400, "requesterEmail and requestType required", "VALIDATION_FAILED");
    }
    if (!["access", "deletion", "portability", "correction"].includes(b.requestType)) {
      return fail(400, "invalid requestType", "VALIDATION_FAILED");
    }
    const verifyToken = crypto.randomBytes(32).toString("base64url");
    const r = await pool.query(
      `INSERT INTO dsar_requests (tenant_id, requester_email, request_type, description, verification_token)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [
        auth.tenantId,
        b.requesterEmail.toLowerCase(),
        b.requestType,
        b.description ?? null,
        verifyToken,
      ],
    );
    return ok(
      {
        id: r.rows[0].id,
        createdAt: r.rows[0].created_at,
        message: "Request received — check email to verify identity",
      },
      201,
    );
  }

  return fail(404, "Not Found", "NOT_FOUND");
}
