/**
 * adapter-github Lambda
 *
 * OAuth2 authorization-code flow with a platform-level GitHub OAuth App.
 * Client_id/secret stored as Lambda env vars (loaded from SSM at config time).
 * OAuth state in DynamoDB atlasit-cache-dev with TTL for CSRF protection.
 *
 * Routes:
 *   GET  /adapters/github/health
 *   GET  /adapters/github/oauth/init        — redirect to GitHub authorize
 *   GET  /adapters/github/oauth/callback    — exchange code for token, store, redirect to /console/apps
 *   GET  /adapters/github/integration       — tenant-scoped connection state
 *   POST /adapters/github/sync              — re-sync using stored token
 *   DEL  /adapters/github/integration       — disconnect
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { extractAuth, AuthError } from "@atlasit/shared/auth/lambda-auth.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;
const svc = bootstrap();

// PG pool (for integrations + compliance_evidence writes)
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

// DynamoDB client (for OAuth state)
const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" }),
);
const STATE_TABLE = process.env.CACHE_TABLE ?? "atlasit-cache-dev";

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
function redirect(location: string): APIGatewayProxyResultV2 {
  return {
    statusCode: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
    body: "",
  };
}

const CONSOLE_BASE = process.env.CONSOLE_BASE_URL ?? "https://www.atlasit.pro";
const OAUTH_CALLBACK_URL =
  process.env.GITHUB_OAUTH_CALLBACK_URL ??
  "https://ahjoepuw96.execute-api.us-east-1.amazonaws.com/adapters/github/oauth/callback";
const SCOPES = "read:org read:user repo";

// ─── GitHub API client ────────────────────────────────────────────────────────

interface GhUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  two_factor_authentication?: boolean;
}

interface GhOrg {
  id: number;
  login: string;
  description: string | null;
  two_factor_requirement_enabled?: boolean | null;
}

interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  archived: boolean;
  default_branch: string;
  owner: { login: string; type: string };
}

interface GhBranchProtection {
  required_status_checks?: { strict: boolean; contexts: string[] } | null;
  enforce_admins?: { enabled: boolean };
  required_pull_request_reviews?: {
    required_approving_review_count: number;
    dismiss_stale_reviews: boolean;
    require_code_owner_reviews: boolean;
  } | null;
  restrictions?: unknown | null;
  required_signatures?: { enabled: boolean };
  required_linear_history?: { enabled: boolean };
}

async function ghFetch(token: string, path: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "atlasit-adapter-github",
    },
  });
}

// ─── OAuth state helpers ──────────────────────────────────────────────────────

interface OAuthState {
  tenantId: string;
  userId: string;
  createdAt: string;
}

async function storeState(state: string, data: OAuthState): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: STATE_TABLE,
      Item: {
        pk: `oauth_state:github:${state}`,
        value: JSON.stringify(data),
        ttl: Math.floor(Date.now() / 1000) + 600, // 10 min
      },
    }),
  );
}

async function consumeState(state: string): Promise<OAuthState | null> {
  const key = `oauth_state:github:${state}`;
  const res = await ddb.send(new GetCommand({ TableName: STATE_TABLE, Key: { pk: key } }));
  if (!res.Item) return null;
  await ddb.send(new DeleteCommand({ TableName: STATE_TABLE, Key: { pk: key } }));
  const expires = (res.Item.ttl as number) ?? 0;
  if (expires > 0 && expires < Math.floor(Date.now() / 1000)) return null;
  try {
    return JSON.parse(res.Item.value as string) as OAuthState;
  } catch {
    return null;
  }
}

// ─── Evidence emission ────────────────────────────────────────────────────────

interface EvidenceRow {
  controlId: string;
  framework: string;
  eventType: string;
  impact: "positive" | "neutral" | "negative";
  reasoning: string;
  actor: string;
  source: string;
}

function evidenceFromOrg(org: GhOrg): EvidenceRow[] {
  const rows: EvidenceRow[] = [];
  if (org.two_factor_requirement_enabled === true) {
    rows.push({
      controlId: "PR.AC-7",
      framework: "NIST_CSF",
      eventType: "github.org.mfa_enforced",
      impact: "positive",
      reasoning: `GitHub org "${org.login}" enforces MFA for all members`,
      actor: org.login,
      source: "github",
    });
    rows.push({
      controlId: "CC6.1",
      framework: "SOC2",
      eventType: "github.org.mfa_enforced",
      impact: "positive",
      reasoning: `Strong authentication required for org "${org.login}"`,
      actor: org.login,
      source: "github",
    });
    rows.push({
      controlId: "A.9.2.4",
      framework: "ISO27001",
      eventType: "github.org.mfa_enforced",
      impact: "positive",
      reasoning: `Secret authentication info managed via MFA in "${org.login}"`,
      actor: org.login,
      source: "github",
    });
    rows.push({
      controlId: "164.312.d",
      framework: "HIPAA",
      eventType: "github.org.mfa_enforced",
      impact: "positive",
      reasoning: `Person/entity authentication enforced via MFA in "${org.login}"`,
      actor: org.login,
      source: "github",
    });
  } else if (org.two_factor_requirement_enabled === false) {
    rows.push({
      controlId: "PR.AC-7",
      framework: "NIST_CSF",
      eventType: "github.org.mfa_not_enforced",
      impact: "negative",
      reasoning: `GitHub org "${org.login}" does not require MFA`,
      actor: org.login,
      source: "github",
    });
  }
  return rows;
}

function evidenceFromRepo(repo: GhRepo, protection: GhBranchProtection | null): EvidenceRow[] {
  const rows: EvidenceRow[] = [];
  const ref = `${repo.full_name}#${repo.default_branch}`;

  if (protection?.required_pull_request_reviews) {
    const r = protection.required_pull_request_reviews;
    const positive = r.required_approving_review_count >= 1;
    rows.push({
      controlId: "CC8.1",
      framework: "SOC2",
      eventType: "github.repo.change_mgmt_enforced",
      impact: positive ? "positive" : "negative",
      reasoning: `${ref}: ${r.required_approving_review_count} approving review(s) required${r.require_code_owner_reviews ? ", code-owner review required" : ""}`,
      actor: repo.full_name,
      source: "github",
    });
    rows.push({
      controlId: "CC7.1",
      framework: "SOC2",
      eventType: "github.repo.change_detection",
      impact: "positive",
      reasoning: `${ref}: configuration changes tracked via required PR reviews`,
      actor: repo.full_name,
      source: "github",
    });
    rows.push({
      controlId: "PR.IP-3",
      framework: "NIST_CSF",
      eventType: "github.repo.change_mgmt_enforced",
      impact: positive ? "positive" : "negative",
      reasoning: `${ref}: PR-based change control, dismiss_stale=${r.dismiss_stale_reviews}`,
      actor: repo.full_name,
      source: "github",
    });
    rows.push({
      controlId: "A.12.6.1",
      framework: "ISO27001",
      eventType: "github.repo.change_mgmt_enforced",
      impact: positive ? "positive" : "negative",
      reasoning: `${ref}: managed code change process`,
      actor: repo.full_name,
      source: "github",
    });
  }
  if (protection?.required_status_checks && protection.required_status_checks.contexts.length > 0) {
    rows.push({
      controlId: "CC7.2",
      framework: "SOC2",
      eventType: "github.repo.ci_required",
      impact: "positive",
      reasoning: `${ref}: required status checks — ${protection.required_status_checks.contexts.slice(0, 3).join(", ")}`,
      actor: repo.full_name,
      source: "github",
    });
  }
  if (protection?.required_signatures?.enabled) {
    rows.push({
      controlId: "CC6.8",
      framework: "SOC2",
      eventType: "github.repo.signed_commits_required",
      impact: "positive",
      reasoning: `${ref}: signed commits required — code authorship verified`,
      actor: repo.full_name,
      source: "github",
    });
  }
  if (repo.private) {
    rows.push({
      controlId: "CC6.7",
      framework: "SOC2",
      eventType: "github.repo.private",
      impact: "positive",
      reasoning: `${ref}: repository is private — source code access restricted`,
      actor: repo.full_name,
      source: "github",
    });
  }
  return rows;
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

// ─── Route handler ────────────────────────────────────────────────────────────

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  let path = event.rawPath;
  path = path.replace(/^\/adapters\/github/, "") || "/";
  const qs = event.queryStringParameters ?? {};

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
    return ok({
      status: "healthy",
      service: "adapter-github",
      timestamp: new Date().toISOString(),
    });
  }

  // ── OAuth callback (NO Bearer auth — GitHub calls this with just the state param) ──
  if (path === "/oauth/callback" && method === "GET") {
    const code = qs.code;
    const state = qs.state;
    if (!code || !state)
      return redirect(`${CONSOLE_BASE}/console/apps?github=error&reason=missing_params`);

    const stored = await consumeState(state);
    if (!stored) return redirect(`${CONSOLE_BASE}/console/apps?github=error&reason=invalid_state`);

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return redirect(`${CONSOLE_BASE}/console/apps?github=error&reason=not_configured`);
    }

    // Exchange code for access_token
    const tokRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: OAUTH_CALLBACK_URL,
      }),
    });
    if (!tokRes.ok)
      return redirect(`${CONSOLE_BASE}/console/apps?github=error&reason=token_exchange_failed`);
    const tok = (await tokRes.json()) as {
      access_token?: string;
      error?: string;
      scope?: string;
      token_type?: string;
    };
    if (!tok.access_token)
      return redirect(
        `${CONSOLE_BASE}/console/apps?github=error&reason=${tok.error ?? "no_token"}`,
      );

    // Verify the token works by fetching /user
    const userRes = await ghFetch(tok.access_token, "/user");
    if (!userRes.ok)
      return redirect(`${CONSOLE_BASE}/console/apps?github=error&reason=user_lookup_failed`);
    const user = (await userRes.json()) as GhUser;

    // Persist integration
    const pool = getPool();
    const id = `github-${stored.tenantId}`;
    await pool.query(
      `INSERT INTO integrations (id, tenant_id, name, type, provider, status, config, installed_at, updated_at)
       VALUES ($1, $2, 'GitHub', 'saas', 'github', 'active', $3::jsonb, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET status = 'active', config = EXCLUDED.config, updated_at = NOW()`,
      [
        id,
        stored.tenantId,
        JSON.stringify({
          accessToken: tok.access_token,
          scope: tok.scope,
          tokenType: tok.token_type,
          connectedBy: stored.userId,
          githubLogin: user.login,
          githubUserId: user.id,
        }),
      ],
    );

    // Kick off initial sync inline (fast enough for a few orgs / ~30 repos)
    const syncRes = await runSync(pool, stored.tenantId, tok.access_token);
    await pool.query(
      `UPDATE integrations SET config = config || $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [id, JSON.stringify({ lastSyncAt: new Date().toISOString(), lastSyncResult: syncRes })],
    );

    return redirect(
      `${CONSOLE_BASE}/console/apps?github=connected&login=${encodeURIComponent(user.login)}&evidence=${syncRes.evidenceCount}`,
    );
  }

  // All other routes require Bearer auth
  let auth: Awaited<ReturnType<typeof extractAuth>>;
  try {
    auth = await extractAuth(event, svc.authRepo);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.status, e.message, "UNAUTHORIZED");
    return fail(401, "Authentication required", "UNAUTHORIZED");
  }
  const { tenantId, userId } = auth;
  const pool = getPool();

  // GET /oauth/init → JSON { authorizeUrl }. Client does window.location = url (so Bearer
  // auth can stay in the fetch and we don't fight browser 302 header rules).
  if (path === "/oauth/init" && method === "GET") {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId || clientId === "placeholder") {
      return fail(
        503,
        "GitHub OAuth not configured — admin must set GITHUB_CLIENT_ID",
        "NOT_CONFIGURED",
      );
    }
    const state = crypto.randomBytes(24).toString("hex");
    await storeState(state, { tenantId, userId, createdAt: new Date().toISOString() });
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", OAUTH_CALLBACK_URL);
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", state);
    url.searchParams.set("allow_signup", "false");
    return ok({ status: "success", data: { authorizeUrl: url.toString() } });
  }

  // GET /integration
  if (path === "/integration" && method === "GET") {
    const r = await pool.query(
      `SELECT id, name, status, config, installed_at as "installedAt", updated_at as "updatedAt"
       FROM integrations WHERE tenant_id = $1 AND provider = 'github'`,
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
        githubLogin: cfg.githubLogin,
        scope: cfg.scope,
        connectedBy: cfg.connectedBy,
        hasToken: Boolean(cfg.accessToken),
        lastSyncAt: cfg.lastSyncAt ?? null,
        lastSyncResult: cfg.lastSyncResult ?? null,
      },
    });
  }

  // POST /sync — re-run sync
  if (path === "/sync" && method === "POST") {
    const r = await pool.query(
      `SELECT config FROM integrations WHERE tenant_id = $1 AND provider = 'github'`,
      [tenantId],
    );
    if (r.rows.length === 0) return fail(400, "GitHub not connected", "NOT_CONNECTED");
    const cfg = r.rows[0].config as { accessToken?: string };
    if (!cfg.accessToken) return fail(400, "Missing stored token", "MISSING_CREDENTIALS");
    const syncRes = await runSync(pool, tenantId, cfg.accessToken);
    await pool.query(
      `UPDATE integrations SET config = config || $2::jsonb, updated_at = NOW()
       WHERE tenant_id = $1 AND provider = 'github'`,
      [tenantId, JSON.stringify({ lastSyncAt: new Date().toISOString(), lastSyncResult: syncRes })],
    );
    return ok({ status: "success", data: syncRes });
  }

  // DELETE /integration — disconnect
  if (path === "/integration" && method === "DELETE") {
    await pool.query(`DELETE FROM integrations WHERE tenant_id = $1 AND provider = 'github'`, [
      tenantId,
    ]);
    return ok({ status: "success", data: { disconnected: true } });
  }

  return fail(404, `Not found: ${method} ${path}`, "NOT_FOUND");
}

async function runSync(
  pool: pg.Pool,
  tenantId: string,
  token: string,
): Promise<{
  orgs: number;
  repos: number;
  evidenceCount: number;
  durationMs: number;
  error?: string;
}> {
  const started = Date.now();
  try {
    const orgsRes = await ghFetch(token, "/user/orgs?per_page=30");
    if (!orgsRes.ok) throw new Error(`GitHub orgs API returned ${orgsRes.status}`);
    const orgList = (await orgsRes.json()) as GhOrg[];

    // Hydrate each org with full metadata (org list endpoint omits 2FA requirement)
    const orgs: GhOrg[] = [];
    for (const o of orgList.slice(0, 10)) {
      const r = await ghFetch(token, `/orgs/${o.login}`);
      if (r.ok) orgs.push((await r.json()) as GhOrg);
      else orgs.push(o);
    }

    const reposRes = await ghFetch(token, "/user/repos?type=owner&per_page=30&sort=updated");
    if (!reposRes.ok) throw new Error(`GitHub repos API returned ${reposRes.status}`);
    const repos = (await reposRes.json()) as GhRepo[];

    const allEvidence: EvidenceRow[] = [];
    for (const o of orgs) allEvidence.push(...evidenceFromOrg(o));

    // Hydrate up to 15 repos with branch protection data
    for (const repo of repos.filter((r) => !r.archived).slice(0, 15)) {
      let protection: GhBranchProtection | null = null;
      const bpRes = await ghFetch(
        token,
        `/repos/${repo.full_name}/branches/${repo.default_branch}/protection`,
      );
      if (bpRes.ok) protection = (await bpRes.json()) as GhBranchProtection;
      allEvidence.push(...evidenceFromRepo(repo, protection));
    }

    const evidenceCount = await writeEvidence(pool, tenantId, allEvidence);
    return {
      orgs: orgs.length,
      repos: repos.length,
      evidenceCount,
      durationMs: Date.now() - started,
    };
  } catch (e) {
    return {
      orgs: 0,
      repos: 0,
      evidenceCount: 0,
      durationMs: Date.now() - started,
      error: (e as Error).message,
    };
  }
}
