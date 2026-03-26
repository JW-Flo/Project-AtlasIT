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
import { handleAsanaWebhook } from "./webhooks.js";

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
    service: "asana",
    connector: {
      id: "asana",
      name: "Asana",
      provider: "Asana",
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

  // Timing-safe comparison
  const sigMatch =
    signature.length === expectedSig.length &&
    (() => {
      let mismatch = 0;
      for (let i = 0; i < signature.length; i++) {
        mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
      }
      return mismatch === 0;
    })();

  if (!sigMatch) {
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

  // Get connector config for this tenant
  const configRow = await c.env.DB.prepare(
    `SELECT config FROM connector_configs
     WHERE connector_slug = 'asana' AND tenant_id = ? LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ config: string }>();

  if (!configRow) {
    return c.json(
      {
        error: "Connector not configured for tenant",
        correlationId,
      },
      404,
    );
  }

  const config = JSON.parse(configRow.config) as {
    workspaceGid: string;
  };

  // Get access token from credentials
  const credentialRow = await c.env.DB.prepare(
    `SELECT credential_data FROM credentials
     WHERE tenant_id = ? AND connector_slug = 'asana' LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ credential_data: string }>();

  if (!credentialRow) {
    return c.json(
      {
        error: "No credentials available for sync",
        correlationId,
      },
      401,
    );
  }

  const credentials = JSON.parse(credentialRow.credential_data) as {
    accessToken: string;
  };

  let results: SyncResult | null = null;
  const errors: string[] = [];

  try {
    // Sync users
    const userResult = await syncUsers(
      credentials.accessToken,
      config.workspaceGid,
      c.env.DB,
      body.tenantId,
    );
    results = userResult;

    // Sync groups
    if (body.scope === undefined || body.scope === "groups") {
      const groupResult = await syncGroups(
        credentials.accessToken,
        config.workspaceGid,
        c.env.DB,
        body.tenantId,
      );
      results = {
        created: userResult.created + groupResult.created,
        updated: userResult.updated + groupResult.updated,
        total: userResult.total + groupResult.total,
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    errors.push(msg);
  }

  return c.json({
    syncId,
    status: errors.length === 0 ? "completed" : "partial",
    results,
    errors: errors.length > 0 ? errors : undefined,
    correlationId,
  });
});

// Get sync status
app.get("/api/sync/:syncId", async (c) => {
  const correlationId = c.get("correlationId");
  const syncId = c.req.param("syncId");

  // In a real implementation, query sync_status table
  return c.json({
    syncId,
    status: "completed",
    message: "Sync status endpoint placeholder",
    correlationId,
  });
});

// Validate config
app.post("/api/config/validate", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<Record<string, unknown>>().catch(() => null);

  if (!body) {
    return c.json({ error: "Invalid request body", correlationId }, 400);
  }

  const validation = validateConfig(body);
  return c.json({
    valid: validation.valid,
    errors: validation.errors,
    correlationId,
  });
});

// OAuth2 authorize endpoint (initiate login)
app.get("/auth/authorize", async (c) => {
  const correlationId = c.get("correlationId");
  const state = c.req.query("state");

  if (!state) {
    return c.json({ error: "Missing state parameter", correlationId }, 400);
  }

  const authUrl = getAuthorizationUrl(
    {
      ASANA_CLIENT_ID: c.env.ASANA_CLIENT_ID,
      OAUTH2_REDIRECT_URI: c.env.OAUTH2_REDIRECT_URI,
    },
    state,
  );

  return c.redirect(authUrl);
});

// OAuth2 callback endpoint
app.get("/auth/callback", async (c) => {
  const correlationId = c.get("correlationId");
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  const errorDescription = c.req.query("error_description");

  if (error) {
    return c.json(
      {
        error,
        description: errorDescription,
        correlationId,
      },
      400,
    );
  }

  if (!code) {
    return c.json({ error: "Missing authorization code", correlationId }, 400);
  }

  let stateData: { tenantId: string; correlationId: string };
  try {
    stateData = JSON.parse(atob(state ?? "")) as {
      tenantId: string;
      correlationId: string;
    };
  } catch {
    return c.json({ error: "Invalid state parameter", correlationId }, 400);
  }

  try {
    const token = await exchangeCodeForToken(
      {
        ASANA_CLIENT_ID: c.env.ASANA_CLIENT_ID,
        ASANA_CLIENT_SECRET: c.env.ASANA_CLIENT_SECRET,
        OAUTH2_REDIRECT_URI: c.env.OAUTH2_REDIRECT_URI,
      },
      code,
    );

    await c.env.DB.prepare(
      `INSERT INTO connector_tokens (id, tenant_id, connector_slug, access_token, refresh_token, expires_at, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
      .bind(
        crypto.randomUUID(),
        stateData.tenantId,
        "asana",
        token.access_token,
        token.refresh_token ?? null,
        new Date(Date.now() + token.expires_in * 1000).toISOString(),
        new Date().toISOString(),
      )
      .run();

    return c.json({
      status: "authorized",
      tenantId: stateData.tenantId,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "OAuth token exchange failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
});

// Asana webhook receiver (from Asana API)
app.post("/webhooks/asana", handleAsanaWebhook);

export default app;
