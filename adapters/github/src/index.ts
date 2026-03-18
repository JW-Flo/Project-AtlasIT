import { Hono } from "hono";
import type { Bindings, Variables, SyncResult } from "./types.js";
import { validateConfig } from "./config.js";
import {
  authMiddleware,
  getAuthorizationUrl,
  exchangeCodeForToken,
} from "./auth.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { handleGitHubWebhook } from "./webhooks.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Correlation ID middleware
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

// Security headers middleware
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
  );
});

// Apply auth middleware to protected routes
app.use("/api/*", authMiddleware);

const requestCounters = new Map<string, { count: number; resetAt: number }>();
app.use("/api/*", async (c, next) => {
  const tenantId = c.req.header("X-Tenant-ID") ?? "default";
  const endpoint = c.req.method + " " + new URL(c.req.url).pathname;
  const key = tenantId + ":" + endpoint;
  const now = Date.now();
  const limit = 120;
  const windowMs = 60_000;
  const existing = requestCounters.get(key);
  const current =
    !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;
  if (current.count >= limit) {
    return c.json(
      { error: "Rate limit exceeded", correlationId: c.get("correlationId") },
      429,
    );
  }
  current.count += 1;
  requestCounters.set(key, current);
  await next();
});

// Health endpoint
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "github",
    connector: {
      id: "github",
      name: "GitHub",
      provider: "GitHub",
      capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
    },
  });
});

// Webhook receiver from orchestrator (internal)
app.post("/webhook", async (c) => {
  const correlationId = c.get("correlationId");
  const signature = c.req.header("X-Signature");
  const eventId = c.req.header("X-Event-ID") ?? "unknown";

  if (!signature) {
    return c.json({ error: "Missing signature", correlationId }, 401);
  }

  const rawBody = await c.req.text();

  // Verify HMAC signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(c.env.ADAPTER_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody),
  );
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature !== expectedSig) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        eventId,
        message: "Invalid webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody);

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      eventId,
      message: "Event received",
      eventType: body.type,
      tenantId: body.tenantId ?? "unknown",
    }),
  );

  return c.json({ status: "processed", eventId, correlationId });
});

// Trigger a full directory sync (users + groups)
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req
    .json<{ tenantId: string; scope?: string }>()
    .catch(() => null);

  if (!body?.tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
  }

  const syncId = crypto.randomUUID();

  // Record sync job in D1
  await c.env.DB.prepare(
    "INSERT INTO sync_jobs (id, tenant_id, connector_slug, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
  )
    .bind(syncId, body.tenantId, "github", "running", new Date().toISOString())
    .run();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      syncId,
      message: "Sync triggered",
      tenantId: body.tenantId,
      connector: "github",
    }),
  );

  // Retrieve stored OAuth token for this tenant
  const tokenRow = await c.env.DB.prepare(
    `SELECT access_token FROM connector_tokens
     WHERE tenant_id = ?1 AND connector_slug = 'github'
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ access_token: string }>();

  if (!tokenRow) {
    await c.env.DB.prepare(
      "UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2",
    )
      .bind(new Date().toISOString(), syncId)
      .run();
    return c.json(
      {
        error: "No OAuth token found for tenant. Authorize first.",
        correlationId,
      },
      400,
    );
  }

  // Retrieve org config
  const configRow = await c.env.DB.prepare(
    `SELECT config FROM connector_configs
     WHERE tenant_id = ?1 AND connector_slug = 'github' LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ config: string }>();

  if (!configRow) {
    await c.env.DB.prepare(
      "UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2",
    )
      .bind(new Date().toISOString(), syncId)
      .run();
    return c.json(
      {
        error: "No connector config found. Configure orgName first.",
        correlationId,
      },
      400,
    );
  }

  const config = JSON.parse(configRow.config) as { orgName: string };
  const validation = validateConfig(
    config as unknown as Record<string, unknown>,
  );
  if (!validation.valid) {
    return c.json(
      { error: "Invalid config", details: validation.errors, correlationId },
      400,
    );
  }

  try {
    const scope = body.scope ?? "all";

    let userResult: SyncResult = { created: 0, updated: 0, total: 0 };
    let groupResult: SyncResult = { created: 0, updated: 0, total: 0 };

    if (scope === "all" || scope === "users") {
      userResult = await syncUsers(
        tokenRow.access_token,
        config.orgName,
        c.env.DB,
        body.tenantId,
      );
    }

    if (scope === "all" || scope === "groups") {
      groupResult = await syncGroups(
        tokenRow.access_token,
        config.orgName,
        c.env.DB,
        body.tenantId,
      );
    }

    // Update connection status
    await updateConnectionStatus(
      c.env.DB,
      body.tenantId,
      userResult.total,
      groupResult.total,
    );

    // Mark sync job complete
    await c.env.DB.prepare(
      "UPDATE sync_jobs SET status = 'completed', completed_at = ?1 WHERE id = ?2",
    )
      .bind(new Date().toISOString(), syncId)
      .run();

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        syncId,
        message: "Sync completed",
        tenantId: body.tenantId,
        users: userResult,
        groups: groupResult,
      }),
    );

    return c.json({
      status: "synced",
      syncId,
      correlationId,
      data: { users: userResult, groups: groupResult },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";

    await c.env.DB.prepare(
      "UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2",
    )
      .bind(new Date().toISOString(), syncId)
      .run();

    await updateConnectionStatus(c.env.DB, body.tenantId, 0, 0, errorMsg);

    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        syncId,
        message: "Sync failed",
        tenantId: body.tenantId,
        error: errorMsg,
      }),
    );

    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// Status endpoint
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json(
      { error: "tenantId query parameter is required", correlationId },
      400,
    );
  }

  const connection = await c.env.DB.prepare(
    `SELECT status, error_msg, last_sync_at, user_count, group_count
     FROM directory_connections WHERE tenant_id = ?1`,
  )
    .bind(tenantId)
    .first<{
      status: string;
      error_msg: string | null;
      last_sync_at: string | null;
      user_count: number;
      group_count: number;
    }>();

  if (!connection) {
    return c.json({
      connector: "github",
      tenantId,
      correlationId,
      status: "not_connected",
      lastSyncAt: null,
      userCount: 0,
      groupCount: 0,
    });
  }

  const recentSyncs = await c.env.DB.prepare(
    `SELECT id, status, created_at, completed_at
     FROM sync_jobs WHERE tenant_id = ?1 AND connector_slug = 'github'
     ORDER BY created_at DESC LIMIT 10`,
  )
    .bind(tenantId)
    .all();

  return c.json({
    connector: "github",
    tenantId,
    correlationId,
    status: connection.status,
    error: connection.error_msg,
    lastSyncAt: connection.last_sync_at,
    userCount: connection.user_count,
    groupCount: connection.group_count,
    recentSyncs: recentSyncs.results,
  });
});

// OAuth2 authorization redirect
app.get("/auth/authorize", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json(
      { error: "tenantId query parameter is required", correlationId },
      400,
    );
  }

  const state = btoa(JSON.stringify({ tenantId, correlationId }));
  const url = getAuthorizationUrl(
    c.env as unknown as Record<string, string>,
    state,
  );

  return c.redirect(url);
});

// OAuth2 callback
app.get("/auth/callback", async (c) => {
  const correlationId = c.get("correlationId");
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) {
    const errorDescription =
      c.req.query("error_description") ?? "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "OAuth callback error",
        error,
        errorDescription,
      }),
    );
    return c.json({ error, errorDescription, correlationId }, 400);
  }

  if (!code || !state) {
    return c.json(
      { error: "Missing code or state parameter", correlationId },
      400,
    );
  }

  let stateData: { tenantId: string; correlationId: string };
  try {
    stateData = JSON.parse(atob(state)) as {
      tenantId: string;
      correlationId: string;
    };
  } catch {
    return c.json({ error: "Invalid state parameter", correlationId }, 400);
  }

  try {
    const tokens = await exchangeCodeForToken(
      c.env as unknown as Record<string, string>,
      code,
    );

    await c.env.DB.prepare(
      `INSERT INTO connector_tokens (id, tenant_id, connector_slug, access_token, refresh_token, expires_at, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
      .bind(
        crypto.randomUUID(),
        stateData.tenantId,
        "github",
        tokens.access_token,
        tokens.refresh_token ?? null,
        new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        new Date().toISOString(),
      )
      .run();

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        message: "OAuth tokens stored",
        tenantId: stateData.tenantId,
        connector: "github",
      }),
    );

    return c.json({
      status: "authorized",
      tenantId: stateData.tenantId,
      correlationId,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Token exchange failed",
        error: errorMessage,
      }),
    );
    return c.json({ error: errorMessage, correlationId }, 500);
  }
});

// GitHub organization webhook receiver
app.post("/webhooks/github/events", (c) => handleGitHubWebhook(c));

// ── Compliance evidence collection ──────────────────────────────────────────
// POST /api/compliance/check — check branch protection across all org repos
// and publish compliance.evidence.collected events to the orchestrator.
app.post("/api/compliance/check", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ tenantId: string; org?: string }>().catch(() => null);

  if (!body?.tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
  }

  const tokenRow = await c.env.DB.prepare(
    `SELECT access_token FROM connector_tokens
     WHERE tenant_id = ?1 AND connector_slug = 'github'
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ access_token: string }>();

  if (!tokenRow) {
    return c.json({ error: "No GitHub token for tenant", correlationId }, 404);
  }

  const headers = {
    Authorization: `token ${tokenRow.access_token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Determine org — prefer explicit param, fall back to first org from /user/orgs
  let org = body.org;
  if (!org) {
    const orgsRes = await fetch("https://api.github.com/user/orgs?per_page=1", { headers });
    const orgs = orgsRes.ok ? (await orgsRes.json() as Array<{ login: string }>) : [];
    org = orgs[0]?.login;
  }
  if (!org) {
    return c.json({ error: "Could not determine GitHub org", correlationId }, 422);
  }

  // Fetch org repos (first page — up to 30)
  const reposRes = await fetch(
    `https://api.github.com/orgs/${org}/repos?per_page=30&sort=updated`,
    { headers },
  );
  if (!reposRes.ok) {
    return c.json({ error: "Failed to fetch repos", correlationId }, 502);
  }
  const repos = (await reposRes.json()) as Array<{ name: string; default_branch: string }>;

  let protectedCount = 0;
  let unprotectedCount = 0;

  for (const repo of repos) {
    const branchRes = await fetch(
      `https://api.github.com/repos/${org}/${repo.name}/branches/${repo.default_branch}`,
      { headers },
    );
    if (!branchRes.ok) continue;
    const branch = (await branchRes.json()) as { protected: boolean };
    if (branch.protected) protectedCount++; else unprotectedCount++;
  }

  const total = protectedCount + unprotectedCount;
  const allProtected = total > 0 && unprotectedCount === 0;

  // Publish compliance evidence event
  await fetch(`${c.env.ORCHESTRATOR_URL}/api/v1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId: body.tenantId,
      type: "compliance.evidence.collected",
      source: "adapter:github",
      payload: {
        framework: "SOC2",
        controlId: "CC6.7",
        controlName: "Branch Protection",
        evidenceType: "automated",
        source: "adapter:github",
        sourceId: `github:${org}`,
        actor: "system",
        subject: `${org} (${total} repos)`,
        metadata: {
          org,
          totalRepos: total,
          protectedBranches: protectedCount,
          unprotectedBranches: unprotectedCount,
          allProtected,
          checkedAt: new Date().toISOString(),
        },
      },
    }),
  }).catch(() => {});

  return c.json({
    ok: true,
    correlationId,
    org,
    totalRepos: total,
    protectedBranches: protectedCount,
    unprotectedBranches: unprotectedCount,
    allProtected,
  });
});

export default app;

// -- Internal helpers --

async function updateConnectionStatus(
  db: D1Database,
  tenantId: string,
  userCount: number,
  groupCount: number,
  error?: string,
): Promise<void> {
  const existing = await db
    .prepare("SELECT id FROM directory_connections WHERE tenant_id = ?1")
    .bind(tenantId)
    .first();

  if (existing) {
    await db
      .prepare(
        `UPDATE directory_connections
         SET status = ?1, error_msg = ?2, last_sync_at = datetime('now'),
             user_count = ?3, group_count = ?4, updated_at = datetime('now')
         WHERE tenant_id = ?5`,
      )
      .bind(
        error ? "error" : "active",
        error ?? null,
        userCount,
        groupCount,
        tenantId,
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO directory_connections (tenant_id, provider, status, error_msg, last_sync_at, user_count, group_count)
         VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5, ?6)`,
      )
      .bind(
        tenantId,
        "github",
        error ? "error" : "active",
        error ?? null,
        userCount,
        groupCount,
      )
      .run();
  }
}
