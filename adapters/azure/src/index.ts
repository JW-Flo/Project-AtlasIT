import { Hono } from "hono";
import type { Bindings } from "./types.js";
import { validateConfig } from "./config.js";
import {
  authMiddleware,
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
} from "./auth.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { publishEvent } from "./event-publisher.js";
import {
  handleSubscriptionValidation,
  handleChangeNotifications,
} from "./webhooks.js";

type Variables = {
  correlationId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ---------------------------------------------------------------------------
// Correlation ID middleware
// ---------------------------------------------------------------------------
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

// ---------------------------------------------------------------------------
// Security headers middleware
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Auth middleware for protected routes
// ---------------------------------------------------------------------------
app.use("/api/*", authMiddleware);

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "azure",
    connector: {
      id: "azure",
      name: "Azure",
      provider: "Microsoft",
      capabilities: [
        "user-provisioning",
        "user-deprovisioning",
        "group-sync",
        "sso",
      ],
    },
  });
});

// ---------------------------------------------------------------------------
// Inbound webhook from orchestrator (HMAC-verified)
// ---------------------------------------------------------------------------
app.post("/webhook", async (c) => {
  const correlationId = c.get("correlationId");
  const signature = c.req.header("X-Signature");
  const eventId = c.req.header("X-Event-ID") ?? "unknown";

  if (!signature) {
    return c.json({ error: "Missing signature", correlationId }, 401);
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

// ---------------------------------------------------------------------------
// Directory sync
// ---------------------------------------------------------------------------
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");

  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const body = await c.req.json<{ azureTenantId?: string }>().catch(() => null);

  // Validate connector config
  const configValues: Record<string, unknown> = {
    tenantId: body?.azureTenantId,
  };
  const validation = validateConfig(configValues);
  if (!validation.valid) {
    return c.json(
      { error: "Invalid config", details: validation.errors, correlationId },
      400,
    );
  }

  // Retrieve stored OAuth tokens
  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token, refresh_token, expires_at FROM connector_tokens WHERE tenant_id = ? AND connector_slug = ?",
  )
    .bind(tenantId, "azure")
    .first<{
      access_token: string;
      refresh_token: string | null;
      expires_at: string;
    }>();

  if (!tokenRow) {
    return c.json(
      {
        error: "No OAuth tokens found -- connect first via /auth/authorize",
        correlationId,
      },
      401,
    );
  }

  let accessToken = tokenRow.access_token;

  // Refresh if expired
  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() >= expiresAt - 60_000) {
    if (!tokenRow.refresh_token) {
      return c.json(
        {
          error: "Access token expired and no refresh token available",
          correlationId,
        },
        401,
      );
    }

    const refreshed = await refreshAccessToken(
      c.env as unknown as Record<string, string>,
      tokenRow.refresh_token,
    );
    accessToken = refreshed.access_token;

    const newExpiresAt = new Date(
      Date.now() + refreshed.expires_in * 1000,
    ).toISOString();

    await c.env.DB.prepare(
      `UPDATE connector_tokens
       SET access_token = ?, expires_at = ?, created_at = ?
       WHERE tenant_id = ? AND connector_slug = ?`,
    )
      .bind(
        accessToken,
        newExpiresAt,
        new Date().toISOString(),
        tenantId,
        "azure",
      )
      .run();
  }

  // Update connection status to syncing
  const existingConn = await c.env.DB.prepare(
    "SELECT id FROM directory_connections WHERE tenant_id = ?",
  )
    .bind(tenantId)
    .first();

  if (existingConn) {
    await c.env.DB.prepare(
      `UPDATE directory_connections
       SET status = 'syncing', provider = 'azure', updated_at = datetime('now')
       WHERE tenant_id = ?`,
    )
      .bind(tenantId)
      .run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO directory_connections (tenant_id, provider, status)
       VALUES (?, 'azure', 'syncing')`,
    )
      .bind(tenantId)
      .run();
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Starting directory sync",
      connector: "azure",
    }),
  );

  try {
    const userResult = await syncUsers(accessToken, c.env.DB, tenantId);
    const groupResult = await syncGroups(accessToken, c.env.DB, tenantId);

    // Update connection with results
    await c.env.DB.prepare(
      `UPDATE directory_connections
       SET status = 'active', last_sync_at = datetime('now'),
           user_count = ?, group_count = ?, error_msg = NULL, updated_at = datetime('now')
       WHERE tenant_id = ?`,
    )
      .bind(userResult.total, groupResult.total, tenantId)
      .run();

    // Publish sync event to orchestrator
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: "directory.synced",
      source: "connector:azure",
      payload: { users: userResult, groups: groupResult },
      correlationId,
    });

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "Directory sync completed",
        users: userResult,
        groups: groupResult,
      }),
    );

    return c.json({
      status: "synced",
      correlationId,
      users: userResult,
      groups: groupResult,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown sync error";

    await c.env.DB.prepare(
      `UPDATE directory_connections
       SET status = 'error', error_msg = ?, updated_at = datetime('now')
       WHERE tenant_id = ?`,
    )
      .bind(errorMessage, tenantId)
      .run();

    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Directory sync failed",
        error: errorMessage,
      }),
    );

    return c.json({ error: errorMessage, correlationId }, 500);
  }
});

// ---------------------------------------------------------------------------
// Sync status
// ---------------------------------------------------------------------------
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID") ?? c.req.query("tenantId");

  if (!tenantId) {
    return c.json(
      { error: "Missing tenantId (header or query)", correlationId },
      400,
    );
  }

  const row = await c.env.DB.prepare(
    `SELECT provider, status, error_msg, last_sync_at, user_count, group_count, updated_at
     FROM directory_connections WHERE tenant_id = ?`,
  )
    .bind(tenantId)
    .first<{
      provider: string;
      status: string;
      error_msg: string | null;
      last_sync_at: string | null;
      user_count: number;
      group_count: number;
      updated_at: string;
    }>();

  if (!row) {
    return c.json({ status: "not_connected", correlationId });
  }

  return c.json({
    provider: row.provider,
    status: row.status,
    error: row.error_msg,
    lastSyncAt: row.last_sync_at,
    userCount: row.user_count,
    groupCount: row.group_count,
    updatedAt: row.updated_at,
    correlationId,
  });
});

// ---------------------------------------------------------------------------
// OAuth2 authorization redirect
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// OAuth2 callback
// ---------------------------------------------------------------------------
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
        "azure",
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
        connector: "azure",
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

// ---------------------------------------------------------------------------
// Microsoft Graph change notifications (webhook receiver)
// ---------------------------------------------------------------------------
app.post("/webhooks/azure/notifications", async (c) => {
  const correlationId = c.get("correlationId");

  // Handle subscription validation handshake
  const validationResponse = await handleSubscriptionValidation(c);
  if (validationResponse) return validationResponse;

  // Verify HMAC signature for real notifications
  const signature = c.req.header("X-Signature");
  if (!signature) {
    return c.json({ error: "Missing signature", correlationId }, 401);
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
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  // Resolve tenant and access token from the notification's Azure tenant ID
  const body = JSON.parse(rawBody) as { value?: Array<{ tenantId?: string }> };
  const azureTenantId = body.value?.[0]?.tenantId;

  // Look up AtlasIT tenant by the Azure AD tenant identifier
  // For now, require X-Tenant-ID header as the mapping table may not exist yet
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  // Retrieve access token for enrichment calls
  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token FROM connector_tokens WHERE tenant_id = ? AND connector_slug = ?",
  )
    .bind(tenantId, "azure")
    .first<{ access_token: string }>();

  const accessToken = tokenRow?.access_token ?? "";

  return handleChangeNotifications(c, accessToken, tenantId);
});

export default app;
