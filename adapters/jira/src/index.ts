import { Hono } from "hono";
import { validateConfig } from "./config.js";
import {
  authMiddleware,
  getAuthorizationUrl,
  exchangeCodeForToken,
} from "./auth.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { handleWebhook } from "./webhooks.js";
import type {
  Bindings,
  JiraWebhookPayload,
  JiraTenantConfig,
  SyncResult,
} from "./types.js";

type Variables = {
  correlationId: string;
};

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
    service: "jira",
    connector: {
      id: "jira",
      name: "Jira",
      provider: "Atlassian",
      capabilities: [
        "user-provisioning",
        "user-deprovisioning",
        "group-sync",
        "issue-tracking",
      ],
    },
  });
});

// Webhook receiver from orchestrator (HMAC-verified internal events)
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

// Trigger a directory sync (users + groups via SCIM)
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");

  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const body = await c.req.json<{
    cloudId: string;
    directoryId: string;
    accessToken: string;
    scope?: "users" | "groups" | "all";
  }>();

  if (!body.cloudId || !body.directoryId) {
    return c.json(
      { error: "cloudId and directoryId are required", correlationId },
      400,
    );
  }

  if (!body.accessToken) {
    return c.json({ error: "accessToken is required", correlationId }, 400);
  }

  const configValidation = validateConfig({
    cloudId: body.cloudId,
    directoryId: body.directoryId,
  });
  if (!configValidation.valid) {
    return c.json(
      {
        error: "Invalid config",
        details: configValidation.errors,
        correlationId,
      },
      400,
    );
  }

  const syncId = crypto.randomUUID();
  const scope = body.scope ?? "all";

  await c.env.DB.prepare(
    "INSERT INTO sync_jobs (id, tenant_id, connector_slug, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
  )
    .bind(syncId, tenantId, "jira", "running", new Date().toISOString())
    .run();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      syncId,
      message: "Directory sync started",
      tenantId,
      connector: "jira",
      scope,
    }),
  );

  try {
    let userResult: SyncResult = { created: 0, updated: 0, total: 0 };
    let groupResult: SyncResult = { created: 0, updated: 0, total: 0 };

    if (scope === "users" || scope === "all") {
      userResult = await syncUsers(
        body.directoryId,
        body.accessToken,
        c.env.DB,
        tenantId,
      );
    }

    if (scope === "groups" || scope === "all") {
      groupResult = await syncGroups(
        body.directoryId,
        body.accessToken,
        c.env.DB,
        tenantId,
      );
    }

    // Update connection status
    await updateConnectionStatus(
      c.env.DB,
      tenantId,
      userResult.total,
      groupResult.total,
    );

    // Mark sync job complete
    await c.env.DB.prepare(
      "UPDATE sync_jobs SET status = ?1, completed_at = ?2 WHERE id = ?3 AND tenant_id = ?4",
    )
      .bind("completed", new Date().toISOString(), syncId, tenantId)
      .run();

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        syncId,
        tenantId,
        message: "Directory sync completed",
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
      "UPDATE sync_jobs SET status = ?1, completed_at = ?2 WHERE id = ?3 AND tenant_id = ?4",
    )
      .bind("failed", new Date().toISOString(), syncId, tenantId)
      .run();

    await updateConnectionStatus(c.env.DB, tenantId, 0, 0, errorMsg);

    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        syncId,
        tenantId,
        message: "Directory sync failed",
        error: errorMsg,
      }),
    );

    return c.json({ error: errorMsg, syncId, correlationId }, 500);
  }
});

// Status endpoint
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID") ?? c.req.query("tenantId");

  if (!tenantId) {
    return c.json(
      { error: "tenantId is required (header or query)", correlationId },
      400,
    );
  }

  const connection = await c.env.DB.prepare(
    "SELECT status, error_msg, last_sync_at, user_count, group_count FROM directory_connections WHERE tenant_id = ?1",
  )
    .bind(tenantId)
    .first<{
      status: string;
      error_msg: string | null;
      last_sync_at: string | null;
      user_count: number;
      group_count: number;
    }>();

  const recentSyncs = await c.env.DB.prepare(
    "SELECT id, status, created_at, completed_at FROM sync_jobs WHERE tenant_id = ?1 AND connector_slug = ?2 ORDER BY created_at DESC LIMIT 10",
  )
    .bind(tenantId, "jira")
    .all();

  return c.json({
    connector: "jira",
    tenantId,
    correlationId,
    connection: connection
      ? {
          status: connection.status,
          error: connection.error_msg,
          lastSyncAt: connection.last_sync_at,
          userCount: connection.user_count,
          groupCount: connection.group_count,
        }
      : { status: "not_connected" },
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
      "INSERT INTO connector_tokens (id, tenant_id, connector_slug, access_token, refresh_token, expires_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    )
      .bind(
        crypto.randomUUID(),
        stateData.tenantId,
        "jira",
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
        connector: "jira",
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

// Receives Jira webhook event payloads and forwards to orchestrator
app.post("/webhooks/jira/events", async (c) => {
  const correlationId = c.get("correlationId");
  const signature = c.req.header("X-Signature");
  const tenantId = c.req.header("X-Tenant-ID");

  if (!signature) {
    return c.json({ error: "Missing signature", correlationId }, 401);
  }

  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const rawBody = await c.req.text();
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
        message: "Invalid Jira webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody) as JiraWebhookPayload;

  try {
    const result = await handleWebhook(body, c.env, tenantId, correlationId);

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        message: "Jira webhook processed",
        webhookEvent: body.webhookEvent,
        atlasEventType: result.eventType,
        processed: result.processed,
        tenantId,
      }),
    );

    return c.json({
      status: result.processed ? "processed" : "ignored",
      webhookEvent: body.webhookEvent,
      atlasEventType: result.eventType,
      correlationId,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Jira webhook processing failed",
        webhookEvent: body.webhookEvent,
        error: errorMsg,
      }),
    );
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// ---------- Internal helpers ----------

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
        "jira",
        error ? "error" : "active",
        error ?? null,
        userCount,
        groupCount,
      )
      .run();
  }
}

export default app;
