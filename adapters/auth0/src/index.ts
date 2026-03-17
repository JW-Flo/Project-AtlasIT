import { Hono } from "hono";
import { validateConfig } from "./config.js";
import {
  authMiddleware,
  getAuthorizationUrl,
  exchangeCodeForToken,
} from "./auth.js";

type Bindings = {
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  DB: D1Database;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
};

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
    service: "auth0",
    connector: {
      id: "auth0",
      name: "Auth0",
      provider: "Okta (Auth0)",
      capabilities: [
        "user-provisioning",
        "user-deprovisioning",
        "group-management",
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

// Trigger a sync operation
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ tenantId: string; scope?: string }>();

  if (!body.tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
  }

  const syncId = crypto.randomUUID();

  await c.env.DB.prepare(
    "INSERT INTO sync_jobs (id, tenant_id, connector_slug, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
  )
    .bind(syncId, body.tenantId, "auth0", "pending", new Date().toISOString())
    .run();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      syncId,
      message: "Sync triggered",
      tenantId: body.tenantId,
      connector: "auth0",
    }),
  );

  return c.json({
    status: "accepted",
    syncId,
    correlationId,
    targets: {
      users: "pending",
      groups: "pending",
    },
  });
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

  const result = await c.env.DB.prepare(
    "SELECT id, status, created_at, completed_at FROM sync_jobs WHERE tenant_id = ?1 AND connector_slug = ?2 ORDER BY created_at DESC LIMIT 10",
  )
    .bind(tenantId, "auth0")
    .all();

  return c.json({
    connector: "auth0",
    tenantId,
    correlationId,
    recentSyncs: result.results,
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
        "auth0",
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
        connector: "auth0",
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
// Receives Auth0 Log Streaming events
app.post("/webhooks/auth0/events", async (c) => {
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
      path: "/webhooks/auth0/events",
      tenantId: body.tenantId ?? "unknown",
    }),
  );

  return c.json({ status: "received", correlationId });
});

export default app;
