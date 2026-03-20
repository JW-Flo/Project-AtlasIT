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
    service: "microsoft-365",
    connector: {
      id: "microsoft-365",
      name: "Microsoft 365",
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

// Webhook receiver from orchestrator
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

// ---------------------------------------------------------------------------
// Directory sync
// ---------------------------------------------------------------------------
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ tenantId: string }>();

  if (!body.tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
  }

  const { tenantId } = body;

  // Retrieve stored OAuth tokens
  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token, refresh_token, expires_at FROM connector_tokens WHERE tenant_id = ? AND connector_slug = ?",
  )
    .bind(tenantId, "microsoft-365")
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

  // Refresh if expired or about to expire
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
       SET access_token = ?, expires_at = ?
       WHERE tenant_id = ? AND connector_slug = ?`,
    )
      .bind(accessToken, newExpiresAt, tenantId, "microsoft-365")
      .run();
  }

  // Update connection status to syncing
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO directory_connections
     (id, tenant_id, provider, status, updated_at)
     VALUES (
       COALESCE(
         (SELECT id FROM directory_connections WHERE tenant_id = ?),
         lower(hex(randomblob(16)))
       ),
       ?, 'microsoft-365', 'syncing', datetime('now')
     )`,
  )
    .bind(tenantId, tenantId)
    .run();

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
      source: "microsoft-365",
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
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json(
      { error: "tenantId query parameter is required", correlationId },
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
        "microsoft-365",
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
        connector: "microsoft-365",
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
// Microsoft Graph change notifications webhook
// ---------------------------------------------------------------------------
app.post("/webhooks/microsoft/notifications", async (c) => {
  const correlationId = c.get("correlationId");
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

  const body = JSON.parse(rawBody);

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Webhook received",
      path: "/webhooks/microsoft/notifications",
      tenantId: body.tenantId ?? "unknown",
    }),
  );

  return c.json({ status: "received", correlationId });
});

// ---------------------------------------------------------------------------
// Evidence collection
// ---------------------------------------------------------------------------
app.post("/api/evidence", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ tenantId?: string }>().catch(() => ({}));
  const tenantId = body.tenantId ?? c.req.header("X-Tenant-ID") ?? "";

  type EvidenceItem = {
    type: string;
    controlRefs: string[];
    status: "pass" | "fail" | "unknown";
    details: Record<string, unknown>;
  };

  const unknownItems = (): EvidenceItem[] => [
    {
      type: "mfa_enforcement",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
      status: "unknown",
      details: { reason: "Graph API error" },
    },
    {
      type: "conditional_access",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.1"],
      status: "unknown",
      details: { reason: "Graph API error" },
    },
    {
      type: "encryption_status",
      controlRefs: ["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"],
      status: "unknown",
      details: { reason: "Requires elevated Graph permissions" },
    },
  ];

  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token FROM connector_tokens WHERE tenant_id = ? AND connector_slug = ?",
  )
    .bind(tenantId, "microsoft-365")
    .first<{ access_token: string }>();

  if (!tokenRow) {
    return c.json({ items: [] });
  }

  try {
    const graphRes = await fetch(
      "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies",
      { headers: { Authorization: `Bearer ${tokenRow.access_token}` } },
    );

    if (!graphRes.ok) {
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Graph API error fetching CA policies",
          status: graphRes.status,
        }),
      );
      return c.json({ items: unknownItems() });
    }

    const data = await graphRes.json<{
      value: Array<{
        state: string;
        grantControls?: { builtInControls?: string[] };
      }>;
    }>();

    const policies = data.value ?? [];
    const enabledPolicies = policies.filter((p) => p.state === "enabled");

    const mfaEnabled = enabledPolicies.some((p) =>
      p.grantControls?.builtInControls?.includes("mfa"),
    );

    const items: EvidenceItem[] = [
      {
        type: "mfa_enforcement",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
        status: mfaEnabled ? "pass" : "fail",
        details: {
          enabledPoliciesWithMfa: enabledPolicies.filter((p) =>
            p.grantControls?.builtInControls?.includes("mfa"),
          ).length,
          totalEnabledPolicies: enabledPolicies.length,
        },
      },
      {
        type: "conditional_access",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.1"],
        status: enabledPolicies.length > 0 ? "pass" : "fail",
        details: {
          enabledPolicies: enabledPolicies.length,
          disabledPolicies: policies.length - enabledPolicies.length,
          totalPolicies: policies.length,
        },
      },
      {
        type: "encryption_status",
        controlRefs: ["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"],
        status: "unknown",
        details: { reason: "Requires elevated Graph permissions" },
      },
    ];

    return c.json({ items });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Failed to collect Microsoft 365 evidence",
        error: err instanceof Error ? err.message : "Unknown error",
      }),
    );
    return c.json({ items: unknownItems() });
  }
});

export default app;
