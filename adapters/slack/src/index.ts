import { Hono } from "hono";
import { validateConfig } from "./config.js";
import {
  authMiddleware,
  getAuthorizationUrl,
  exchangeCodeForToken,
} from "./auth.js";
import type {
  Bindings,
  Variables,
  SlackEventBody,
  SlackInteractionPayload,
} from "./types.js";
import {
  verifySlackSignature,
  handleUrlVerification,
  handleEvent,
  handleInteraction,
} from "./webhooks.js";
import {
  sendNotification,
  sendIncidentAlert,
  sendApprovalRequest,
} from "./notifications.js";
import type { IncidentAlert, ApprovalRequest } from "./types.js";

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
// Auth middleware for protected API routes
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "slack",
    connector: {
      id: "slack",
      name: "Slack",
      provider: "Slack Technologies",
      capabilities: ["notifications", "approvals", "webhooks"],
    },
  });
});

// ---------------------------------------------------------------------------
// Webhook receiver from orchestrator (HMAC-verified)
// ---------------------------------------------------------------------------
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
// Sync trigger
// ---------------------------------------------------------------------------
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
    .bind(syncId, body.tenantId, "slack", "pending", new Date().toISOString())
    .run();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      syncId,
      message: "Sync triggered",
      tenantId: body.tenantId,
      connector: "slack",
    }),
  );

  return c.json({
    status: "accepted",
    syncId,
    correlationId,
    targets: {
      default: "pending",
    },
  });
});

// ---------------------------------------------------------------------------
// Status
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

  const result = await c.env.DB.prepare(
    "SELECT id, status, created_at, completed_at FROM sync_jobs WHERE tenant_id = ?1 AND connector_slug = ?2 ORDER BY created_at DESC LIMIT 10",
  )
    .bind(tenantId, "slack")
    .all();

  return c.json({
    connector: "slack",
    tenantId,
    correlationId,
    recentSyncs: result.results,
  });
});

// ---------------------------------------------------------------------------
// Notification API routes
// ---------------------------------------------------------------------------

app.post("/api/notify", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{
    tenantId: string;
    channel: string;
    text: string;
    blocks?: unknown[];
  }>();

  if (!body.tenantId || !body.channel || !body.text) {
    return c.json(
      { error: "tenantId, channel, and text are required", correlationId },
      400,
    );
  }

  try {
    const result = await sendNotification(
      c.env.SLACK_BOT_TOKEN,
      body.channel,
      body.text,
      body.blocks as import("./types.js").SlackBlock[] | undefined,
    );
    return c.json({
      status: "sent",
      correlationId,
      channel: result.channel,
      ts: result.ts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Notification failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
});

app.post("/api/notify/incident", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{
    tenantId: string;
    channel: string;
    incident: IncidentAlert;
  }>();

  if (!body.tenantId || !body.channel || !body.incident) {
    return c.json(
      { error: "tenantId, channel, and incident are required", correlationId },
      400,
    );
  }

  try {
    const result = await sendIncidentAlert(
      c.env.SLACK_BOT_TOKEN,
      body.channel,
      body.incident,
    );
    return c.json({
      status: "sent",
      correlationId,
      channel: result.channel,
      ts: result.ts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Incident alert failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
});

app.post("/api/notify/approval", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{
    tenantId: string;
    userId: string;
    request: ApprovalRequest;
  }>();

  if (!body.tenantId || !body.userId || !body.request) {
    return c.json(
      { error: "tenantId, userId, and request are required", correlationId },
      400,
    );
  }

  try {
    const result = await sendApprovalRequest(
      c.env.SLACK_BOT_TOKEN,
      body.userId,
      body.request,
    );
    return c.json({
      status: "sent",
      correlationId,
      channel: result.channel,
      ts: result.ts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Approval request failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
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
        "slack",
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
        connector: "slack",
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
// Slack Events API endpoint (receives events from Slack)
// ---------------------------------------------------------------------------
app.post("/webhooks/slack/events", async (c) => {
  const correlationId = c.get("correlationId");
  const slackSignature = c.req.header("X-Slack-Signature");
  const slackTimestamp = c.req.header("X-Slack-Request-Timestamp");

  const rawBody = await c.req.text();

  // Verify Slack request signature if signing secret is configured
  if (c.env.SLACK_SIGNING_SECRET) {
    if (!slackSignature || !slackTimestamp) {
      return c.json(
        { error: "Missing Slack signature headers", correlationId },
        401,
      );
    }

    const valid = await verifySlackSignature(
      c.env.SLACK_SIGNING_SECRET,
      slackSignature,
      slackTimestamp,
      rawBody,
    );

    if (!valid) {
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          message: "Invalid Slack request signature",
        }),
      );
      return c.json({ error: "Invalid signature", correlationId }, 401);
    }
  }

  const body = JSON.parse(rawBody) as SlackEventBody;

  // URL verification challenge (Slack Events API setup)
  if (body.type === "url_verification") {
    return handleUrlVerification(body);
  }

  // Event callback
  if (body.type === "event_callback") {
    const tenantId = c.req.header("X-Tenant-ID") ?? body.team_id;

    try {
      const result = await handleEvent(body, c.env, tenantId, correlationId);

      console.log(
        JSON.stringify({
          level: "info",
          correlationId,
          message: "Slack event processed",
          eventId: body.event_id,
          eventType: body.event.type,
          atlasEventType: result.eventType,
          processed: result.processed,
        }),
      );

      return c.json({ status: "ok", correlationId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return c.json({ error: msg, correlationId }, 500);
    }
  }

  return c.json({ status: "unhandled", correlationId });
});

// ---------------------------------------------------------------------------
// Slack Interactive Components endpoint
// ---------------------------------------------------------------------------
app.post("/webhooks/slack/interactions", async (c) => {
  const correlationId = c.get("correlationId");
  const slackSignature = c.req.header("X-Slack-Signature");
  const slackTimestamp = c.req.header("X-Slack-Request-Timestamp");

  const rawBody = await c.req.text();

  // Verify Slack request signature if signing secret is configured
  if (c.env.SLACK_SIGNING_SECRET) {
    if (!slackSignature || !slackTimestamp) {
      return c.json(
        { error: "Missing Slack signature headers", correlationId },
        401,
      );
    }

    const valid = await verifySlackSignature(
      c.env.SLACK_SIGNING_SECRET,
      slackSignature,
      slackTimestamp,
      rawBody,
    );

    if (!valid) {
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          message: "Invalid Slack interaction signature",
        }),
      );
      return c.json({ error: "Invalid signature", correlationId }, 401);
    }
  }

  // Slack sends interactive payloads as form-encoded with a "payload" field
  let payload: SlackInteractionPayload;
  try {
    if (rawBody.startsWith("payload=")) {
      const decoded = decodeURIComponent(rawBody.slice("payload=".length));
      payload = JSON.parse(decoded) as SlackInteractionPayload;
    } else {
      payload = JSON.parse(rawBody) as SlackInteractionPayload;
    }
  } catch {
    return c.json({ error: "Invalid payload", correlationId }, 400);
  }

  const tenantId = c.req.header("X-Tenant-ID") ?? payload.team.id;

  try {
    const result = await handleInteraction(
      payload,
      c.env,
      tenantId,
      correlationId,
    );

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        message: "Slack interaction processed",
        interactionType: payload.type,
        processed: result.processed,
        actions: result.actions,
      }),
    );

    return c.json({ status: "ok", correlationId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Interaction processing failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
});

export default app;
