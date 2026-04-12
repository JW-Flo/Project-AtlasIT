/**
 * adapter-okta Lambda
 *
 * Minimal Okta IdP adapter: connect (API token), sync users/groups, emit evidence.
 * API token stored in integrations.config. Sync writes directory_users and emits
 * compliance_evidence events for each user/group so CDT rules can score against them.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { extractAuth, AuthError } from "@atlasit/shared/auth/lambda-auth.js";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;
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
      .then((c) => c.release())
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
function parseBody(event: APIGatewayProxyEventV2): Record<string, unknown> {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ─── Okta REST client ─────────────────────────────────────────────────────────

interface OktaUser {
  id: string;
  status: string;
  created: string;
  lastLogin: string | null;
  profile: {
    firstName?: string;
    lastName?: string;
    email: string;
    login?: string;
    displayName?: string;
    department?: string;
    title?: string;
  };
  credentials?: { provider?: { type: string } };
}

interface OktaGroup {
  id: string;
  type: string;
  profile: { name: string; description?: string };
}

function normalizeOrgUrl(url: string): string {
  let u = url.trim().replace(/\/$/, "");
  if (!u.startsWith("http")) u = `https://${u}`;
  return u;
}

async function oktaFetch(orgUrl: string, apiToken: string, path: string): Promise<Response> {
  const url = `${normalizeOrgUrl(orgUrl)}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `SSWS ${apiToken}`,
      Accept: "application/json",
    },
  });
  return res;
}

async function listUsers(orgUrl: string, apiToken: string, limit = 200): Promise<OktaUser[]> {
  const users: OktaUser[] = [];
  let next: string | null = `/api/v1/users?limit=${limit}`;
  while (next && users.length < 1000) {
    const res = await oktaFetch(orgUrl, apiToken, next);
    if (!res.ok) throw new Error(`Okta users API returned ${res.status}`);
    const batch = (await res.json()) as OktaUser[];
    users.push(...batch);
    const link = res.headers.get("link") ?? "";
    const m = link.match(/<([^>]+)>;\s*rel="next"/);
    next = m ? m[1].replace(normalizeOrgUrl(orgUrl), "") : null;
  }
  return users;
}

async function listGroups(orgUrl: string, apiToken: string, limit = 100): Promise<OktaGroup[]> {
  const res = await oktaFetch(orgUrl, apiToken, `/api/v1/groups?limit=${limit}`);
  if (!res.ok) throw new Error(`Okta groups API returned ${res.status}`);
  return (await res.json()) as OktaGroup[];
}

function mapOktaStatus(status: string): string {
  const m: Record<string, string> = {
    ACTIVE: "active",
    STAGED: "pending",
    PROVISIONED: "pending",
    RECOVERY: "inactive",
    PASSWORD_EXPIRED: "active",
    LOCKED_OUT: "suspended",
    SUSPENDED: "suspended",
    DEPROVISIONED: "inactive",
  };
  return m[status] ?? "inactive";
}

// ─── Evidence emission ────────────────────────────────────────────────────────
// Map Okta actions → control ids so the CDT hybrid evaluator can score them.
// Control ids use the short form stored in compliance_evidence (e.g. "CC6.1"),
// not the registry's "SOC2-CC6.1" form. The evaluate hybrid's normalizer handles matching.

interface EvidenceRow {
  controlId: string;
  framework: string;
  eventType: string;
  impact: "positive" | "neutral" | "negative";
  reasoning: string;
  actor: string;
  source: string;
}

function evidenceForUser(user: OktaUser): EvidenceRow[] {
  const email = user.profile.email;
  const rows: EvidenceRow[] = [];
  const provisioned = user.status === "ACTIVE" || user.status === "PROVISIONED";
  const deprovisioned = user.status === "DEPROVISIONED" || user.status === "SUSPENDED";

  if (provisioned) {
    // Identity managed + authenticated via IdP
    rows.push({
      controlId: "PR.AC-1",
      framework: "NIST_CSF",
      eventType: "okta.user.active",
      impact: "positive",
      reasoning: `Okta IdP managing identity for ${email} (status=${user.status})`,
      actor: email,
      source: "okta",
    });
    rows.push({
      controlId: "CC6.1",
      framework: "SOC2",
      eventType: "okta.user.active",
      impact: "positive",
      reasoning: `Okta enforces logical access control for ${email}`,
      actor: email,
      source: "okta",
    });
    rows.push({
      controlId: "A.9.2.2",
      framework: "ISO27001",
      eventType: "okta.user.active",
      impact: "positive",
      reasoning: `User access provisioning via Okta for ${email}`,
      actor: email,
      source: "okta",
    });
    rows.push({
      controlId: "164.312.a1",
      framework: "HIPAA",
      eventType: "okta.user.active",
      impact: "positive",
      reasoning: `Unique user identification in Okta for ${email}`,
      actor: email,
      source: "okta",
    });
    rows.push({
      controlId: "PR.AC-7",
      framework: "NIST_CSF",
      eventType: "okta.user.authenticated",
      impact: "positive",
      reasoning: `${email} authenticates via Okta`,
      actor: email,
      source: "okta",
    });
  }
  if (deprovisioned) {
    rows.push({
      controlId: "CC6.2",
      framework: "SOC2",
      eventType: "okta.user.deprovisioned",
      impact: "positive",
      reasoning: `Access revoked for ${email} (status=${user.status})`,
      actor: email,
      source: "okta",
    });
    rows.push({
      controlId: "A.9.2.6",
      framework: "ISO27001",
      eventType: "okta.user.deprovisioned",
      impact: "positive",
      reasoning: `Removal of access rights for ${email}`,
      actor: email,
      source: "okta",
    });
  }
  return rows;
}

function evidenceForGroup(group: OktaGroup): EvidenceRow[] {
  return [
    {
      controlId: "CC6.3",
      framework: "SOC2",
      eventType: "okta.group.catalogued",
      impact: "positive",
      reasoning: `Role-based access group "${group.profile.name}" managed in Okta`,
      actor: "system",
      source: "okta",
    },
    {
      controlId: "A.9.1.1",
      framework: "ISO27001",
      eventType: "okta.group.catalogued",
      impact: "positive",
      reasoning: `Access control policy enforced via group "${group.profile.name}"`,
      actor: "system",
      source: "okta",
    },
  ];
}

async function writeEvidence(
  pool: pg.Pool,
  tenantId: string,
  rows: EvidenceRow[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const values: unknown[] = [];
  const placeholders = rows
    .map((r, i) => {
      const base = i * 8;
      values.push(
        crypto.randomUUID(),
        tenantId,
        r.framework,
        r.controlId,
        r.eventType,
        r.source,
        r.actor,
        JSON.stringify({
          impact: r.impact,
          eventType: r.eventType,
          reasoning: r.reasoning,
          confidence: 1,
          auditAction: r.eventType,
        }),
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, 'adapter', $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}::jsonb, NOW())`;
    })
    .join(",");
  await pool.query(
    `INSERT INTO compliance_evidence
       (id, tenant_id, framework, control_id, evidence_type, source, source_id, actor, metadata, created_at)
     VALUES ${placeholders}
     ON CONFLICT DO NOTHING`,
    values,
  );
  return rows.length;
}

async function upsertDirectoryUsers(
  pool: pg.Pool,
  tenantId: string,
  users: OktaUser[],
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;
  for (const u of users) {
    const display =
      u.profile.displayName ??
      (`${u.profile.firstName ?? ""} ${u.profile.lastName ?? ""}`.trim() || u.profile.email);
    const res = await pool.query(
      `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, 'okta', NOW(), NOW())
       ON CONFLICT (tenant_id, external_id) DO UPDATE SET
         email = EXCLUDED.email, display_name = EXCLUDED.display_name,
         department = EXCLUDED.department, title = EXCLUDED.title,
         status = EXCLUDED.status, raw_attributes = EXCLUDED.raw_attributes,
         updated_at = NOW()
       RETURNING (xmax = 0) as inserted`,
      [
        crypto.randomUUID(),
        tenantId,
        u.id,
        u.profile.email,
        display,
        u.profile.department ?? null,
        u.profile.title ?? null,
        mapOktaStatus(u.status),
        JSON.stringify(u.profile),
      ],
    );
    if (res.rows[0]?.inserted) created++;
    else updated++;
  }
  return { created, updated };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  let path = event.rawPath;
  // Strip the API GW path prefix so routing is clean
  path = path.replace(/^\/adapters\/okta/, "") || "/";

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": event.headers?.origin ?? "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, content-type, x-api-key, x-correlation-id, x-tenant-id",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "7200",
      },
      body: "",
    };
  }

  if (path === "/health" && method === "GET") {
    return ok({ status: "healthy", service: "adapter-okta", timestamp: new Date().toISOString() });
  }

  let auth: Awaited<ReturnType<typeof extractAuth>>;
  try {
    auth = await extractAuth(event, svc.authRepo);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.status, e.message, "UNAUTHORIZED");
    return fail(401, "Authentication required", "UNAUTHORIZED");
  }
  const { tenantId } = auth;
  const pool = getPool();

  // GET /integration — return the current Okta integration row (token redacted)
  if (path === "/integration" && method === "GET") {
    const r = await pool.query(
      `SELECT id, name, status, config, installed_at as "installedAt", updated_at as "updatedAt"
       FROM integrations WHERE tenant_id = $1 AND provider = 'okta'`,
      [tenantId],
    );
    if (r.rows.length === 0) return ok({ status: "success", data: null });
    const row = r.rows[0];
    const cfg = (row.config ?? {}) as Record<string, unknown>;
    return ok({
      status: "success",
      data: {
        id: row.id,
        name: row.name,
        status: row.status,
        installedAt: row.installedAt,
        updatedAt: row.updatedAt,
        orgUrl: cfg.orgUrl,
        hasToken: Boolean(cfg.apiToken),
        lastSyncAt: cfg.lastSyncAt ?? null,
        lastSyncResult: cfg.lastSyncResult ?? null,
      },
    });
  }

  // POST /connect — validate creds, upsert integration, run initial sync
  if (path === "/connect" && method === "POST") {
    const body = parseBody(event) as { orgUrl?: string; apiToken?: string };
    if (!body.orgUrl || !body.apiToken)
      return fail(400, "orgUrl and apiToken required", "VALIDATION_FAILED");

    // Test credentials — Okta org metadata endpoint
    const test = await oktaFetch(body.orgUrl, body.apiToken, "/api/v1/users/me")
      .catch((e) => {
        throw new Error(`Connection test failed: ${(e as Error).message}`);
      })
      .catch((e) => {
        return {
          ok: false,
          status: 500,
          text: async () => (e as Error).message,
        } as unknown as Response;
      });
    // /users/me fails with API token (tokens aren't users), so a 404 on /users/me means token is valid
    // Instead test the groups endpoint which tokens can access
    const validate = await oktaFetch(body.orgUrl, body.apiToken, "/api/v1/groups?limit=1");
    if (!validate.ok) {
      return fail(
        400,
        `Okta rejected credentials (HTTP ${validate.status}). Check org URL and API token.`,
        "CONNECTION_FAILED",
      );
    }

    const id = `okta-${tenantId}`;
    await pool.query(
      `INSERT INTO integrations (id, tenant_id, name, type, provider, status, config, installed_at, updated_at)
       VALUES ($1, $2, 'Okta', 'saas', 'okta', 'active', $3::jsonb, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         status = 'active', config = EXCLUDED.config, updated_at = NOW()`,
      [
        id,
        tenantId,
        JSON.stringify({ orgUrl: normalizeOrgUrl(body.orgUrl), apiToken: body.apiToken }),
      ],
    );

    // Run initial sync inline (fast enough for ~100-1000 users)
    const syncRes = await runSync(pool, tenantId, normalizeOrgUrl(body.orgUrl), body.apiToken);
    await pool.query(
      `UPDATE integrations SET config = config || $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [id, JSON.stringify({ lastSyncAt: new Date().toISOString(), lastSyncResult: syncRes })],
    );

    return ok({ status: "success", data: { connected: true, ...syncRes } });
  }

  // POST /sync — re-run sync using stored token
  if (path === "/sync" && method === "POST") {
    const r = await pool.query(
      `SELECT config FROM integrations WHERE tenant_id = $1 AND provider = 'okta'`,
      [tenantId],
    );
    if (r.rows.length === 0)
      return fail(400, "Okta not connected for this tenant", "NOT_CONNECTED");
    const cfg = r.rows[0].config as { orgUrl?: string; apiToken?: string };
    if (!cfg.orgUrl || !cfg.apiToken)
      return fail(400, "Okta integration has no credentials", "MISSING_CREDENTIALS");
    const syncRes = await runSync(pool, tenantId, cfg.orgUrl, cfg.apiToken);
    await pool.query(
      `UPDATE integrations SET config = config || $2::jsonb, updated_at = NOW()
       WHERE tenant_id = $1 AND provider = 'okta'`,
      [tenantId, JSON.stringify({ lastSyncAt: new Date().toISOString(), lastSyncResult: syncRes })],
    );
    return ok({ status: "success", data: syncRes });
  }

  // DELETE /integration — disconnect
  if (path === "/integration" && method === "DELETE") {
    await pool.query(`DELETE FROM integrations WHERE tenant_id = $1 AND provider = 'okta'`, [
      tenantId,
    ]);
    return ok({ status: "success", data: { disconnected: true } });
  }

  return fail(404, `Not found: ${method} ${path}`, "NOT_FOUND");
}

async function runSync(
  pool: pg.Pool,
  tenantId: string,
  orgUrl: string,
  apiToken: string,
): Promise<{
  users: number;
  groups: number;
  created: number;
  updated: number;
  evidenceCount: number;
  durationMs: number;
  error?: string;
}> {
  const started = Date.now();
  try {
    const [users, groups] = await Promise.all([
      listUsers(orgUrl, apiToken),
      listGroups(orgUrl, apiToken),
    ]);
    const dirRes = await upsertDirectoryUsers(pool, tenantId, users);
    const userEvidence = users.flatMap(evidenceForUser);
    const groupEvidence = groups.flatMap(evidenceForGroup);
    const evidenceCount = await writeEvidence(pool, tenantId, [...userEvidence, ...groupEvidence]);
    return {
      users: users.length,
      groups: groups.length,
      created: dirRes.created,
      updated: dirRes.updated,
      evidenceCount,
      durationMs: Date.now() - started,
    };
  } catch (e) {
    return {
      users: 0,
      groups: 0,
      created: 0,
      updated: 0,
      evidenceCount: 0,
      durationMs: Date.now() - started,
      error: (e as Error).message,
    };
  }
}
