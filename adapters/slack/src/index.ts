import { Hono } from "hono";
import { validateConfig } from "./config.js";
import { authMiddleware, getAuthorizationUrl, exchangeCodeForToken } from "./auth.js";
import type { Bindings, Variables, SlackEventBody, SlackInteractionPayload } from "./types.js";
import {
  verifySlackSignature,
  handleUrlVerification,
  handleEvent,
  handleInteraction,
} from "./webhooks.js";
import { sendNotification, sendIncidentAlert, sendApprovalRequest } from "./notifications.js";
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
  c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
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
    !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  if (current.count >= limit) {
    return c.json({ error: "Rate limit exceeded", correlationId: c.get("correlationId") }, 429);
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
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
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
    return c.json({ error: "tenantId query parameter is required", correlationId }, 400);
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
    return c.json({ error: "tenantId, channel, and text are required", correlationId }, 400);
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
    return c.json({ error: "tenantId, channel, and incident are required", correlationId }, 400);
  }

  try {
    const result = await sendIncidentAlert(c.env.SLACK_BOT_TOKEN, body.channel, body.incident);
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
    return c.json({ error: "tenantId, userId, and request are required", correlationId }, 400);
  }

  try {
    const result = await sendApprovalRequest(c.env.SLACK_BOT_TOKEN, body.userId, body.request);
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
// Provision: invite user to Slack workspace
// ---------------------------------------------------------------------------
app.post("/api/provision", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const body = await c.req.json<{
    userProfile: {
      id?: string;
      externalId?: string;
      email?: string;
      displayName?: string;
      firstName?: string;
      lastName?: string;
      department?: string;
      title?: string;
      manager?: string;
      phone?: string;
      groups: string[];
      appAccess: unknown[];
      rawAttributes: Record<string, unknown>;
    };
    config?: Record<string, unknown>;
  }>().catch(() => null);

  if (!body) {
    return c.json({ error: "Invalid JSON body", correlationId }, 400);
  }
  if (!body.userProfile?.email) {
    return c.json({ error: "userProfile.email is required", correlationId }, 400);
  }

  const { userProfile } = body;

  // Step 1: get team_id
  let teamId: string;
  try {
    const teamRes = await fetch("https://slack.com/api/team.info", {
      headers: { Authorization: `Bearer ${c.env.SLACK_BOT_TOKEN}` },
    });
    const teamData = await teamRes.json<{ ok: boolean; team?: { id: string }; error?: string }>();
    if (!teamData.ok || !teamData.team) {
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Failed to fetch Slack team info",
          slackError: teamData.error ?? "unknown",
        }),
      );
      return c.json({ error: "Failed to fetch Slack team info", correlationId }, 502);
    }
    teamId = teamData.team.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Slack team.info request failed",
        error: msg,
      }),
    );
    return c.json({ error: "Slack team.info request failed", correlationId }, 502);
  }

  // Step 2: invite via admin.users.invite (Enterprise Grid)
  const inviteParams = new URLSearchParams({
    team_id: teamId,
    email: userProfile.email,
    ...(userProfile.firstName ? { first_name: userProfile.firstName } : {}),
    ...(userProfile.lastName ? { last_name: userProfile.lastName } : {}),
  });

  try {
    const inviteRes = await fetch("https://slack.com/api/admin.users.invite", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.SLACK_BOT_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: inviteParams.toString(),
    });
    const inviteData = await inviteRes.json<{ ok: boolean; error?: string }>();

    if (!inviteData.ok) {
      // admin.users.invite requires Enterprise Grid — fall back to pending_manual
      if (
        inviteData.error === "not_allowed" ||
        inviteData.error === "not_supported" ||
        inviteData.error === "missing_scope" ||
        inviteData.error === "enterprise_only"
      ) {
        console.log(
          JSON.stringify({
            level: "info",
            correlationId,
            tenantId,
            message: "admin.users.invite unavailable; returning pending_manual",
            slackError: inviteData.error,
            email: userProfile.email,
          }),
        );
        return c.json({
          status: "pending_manual",
          correlationId,
          tenantId,
          email: userProfile.email,
          reason: "admin.users.invite requires Enterprise Grid; manual invite required",
        });
      }

      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Slack admin.users.invite failed",
          slackError: inviteData.error,
          email: userProfile.email,
        }),
      );
      return c.json({ error: `Slack invite failed: ${inviteData.error}`, correlationId }, 502);
    }

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "User provisioned in Slack",
        email: userProfile.email,
      }),
    );

    return c.json({
      status: "provisioned",
      correlationId,
      tenantId,
      email: userProfile.email,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Slack provision request failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
});

// ---------------------------------------------------------------------------
// Deprovision: deactivate user from Slack workspace
// ---------------------------------------------------------------------------
app.post("/api/deprovision", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const body = await c.req.json<{
    userProfile: {
      id?: string;
      externalId?: string;
      email?: string;
      displayName?: string;
      firstName?: string;
      lastName?: string;
      department?: string;
      title?: string;
      manager?: string;
      phone?: string;
      groups: string[];
      appAccess: unknown[];
      rawAttributes: Record<string, unknown>;
    };
    config?: Record<string, unknown>;
  }>().catch(() => null);

  if (!body) {
    return c.json({ error: "Invalid JSON body", correlationId }, 400);
  }
  if (!body.userProfile?.email) {
    return c.json({ error: "userProfile.email is required", correlationId }, 400);
  }

  const { userProfile } = body;

  // Step 1: look up user by email
  let slackUserId: string;
  let teamId: string;
  try {
    const lookupUrl = `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(userProfile.email)}`;
    const lookupRes = await fetch(lookupUrl, {
      headers: { Authorization: `Bearer ${c.env.SLACK_BOT_TOKEN}` },
    });
    const lookupData = await lookupRes.json<{
      ok: boolean;
      user?: { id: string; team_id: string };
      error?: string;
    }>();

    if (!lookupData.ok || !lookupData.user) {
      if (lookupData.error === "users_not_found") {
        console.log(
          JSON.stringify({
            level: "info",
            correlationId,
            tenantId,
            message: "User not found in Slack; skipping deprovision",
            email: userProfile.email,
          }),
        );
        return c.json({
          status: "deprovisioned",
          correlationId,
          tenantId,
          email: userProfile.email,
          reason: "User not found in Slack workspace",
        });
      }
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Slack users.lookupByEmail failed",
          slackError: lookupData.error ?? "unknown",
          email: userProfile.email,
        }),
      );
      return c.json({ error: `Slack user lookup failed: ${lookupData.error}`, correlationId }, 502);
    }

    slackUserId = lookupData.user.id;
    teamId = lookupData.user.team_id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Slack users.lookupByEmail request failed",
        error: msg,
      }),
    );
    return c.json({ error: "Slack user lookup request failed", correlationId }, 502);
  }

  // Step 2: deactivate via admin.users.remove (Enterprise Grid)
  const removeParams = new URLSearchParams({ team_id: teamId, user_id: slackUserId });

  try {
    const removeRes = await fetch("https://slack.com/api/admin.users.remove", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.SLACK_BOT_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: removeParams.toString(),
    });
    const removeData = await removeRes.json<{ ok: boolean; error?: string }>();

    if (!removeData.ok) {
      // admin.users.remove requires Enterprise Grid — fall back to pending_manual
      if (
        removeData.error === "not_allowed" ||
        removeData.error === "not_supported" ||
        removeData.error === "missing_scope" ||
        removeData.error === "enterprise_only"
      ) {
        console.log(
          JSON.stringify({
            level: "info",
            correlationId,
            tenantId,
            message: "admin.users.remove unavailable; returning pending_manual",
            slackError: removeData.error,
            email: userProfile.email,
          }),
        );
        return c.json({
          status: "pending_manual",
          correlationId,
          tenantId,
          email: userProfile.email,
          reason: "admin.users.remove requires Enterprise Grid; manual deactivation required",
        });
      }

      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Slack admin.users.remove failed",
          slackError: removeData.error,
          email: userProfile.email,
          slackUserId,
        }),
      );
      return c.json({ error: `Slack deprovision failed: ${removeData.error}`, correlationId }, 502);
    }

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "User deprovisioned from Slack",
        email: userProfile.email,
        slackUserId,
      }),
    );

    return c.json({
      status: "deprovisioned",
      correlationId,
      tenantId,
      email: userProfile.email,
      slackUserId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Slack deprovision request failed",
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
    return c.json({ error: "tenantId query parameter is required", correlationId }, 400);
  }

  const state = btoa(JSON.stringify({ tenantId, correlationId }));
  const url = getAuthorizationUrl(c.env as unknown as Record<string, string>, state);

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
    const errorDescription = c.req.query("error_description") ?? "Unknown error";
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
    return c.json({ error: "Missing code or state parameter", correlationId }, 400);
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
    const tokens = await exchangeCodeForToken(c.env as unknown as Record<string, string>, code);

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
      return c.json({ error: "Missing Slack signature headers", correlationId }, 401);
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
      return c.json({ error: "Missing Slack signature headers", correlationId }, 401);
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
    const result = await handleInteraction(payload, c.env, tenantId, correlationId);

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

// ---------------------------------------------------------------------------
// Evidence collection
// ---------------------------------------------------------------------------
app.post("/api/evidence", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ tenantId?: string }>().catch((): { tenantId?: string } => ({}));
  const tenantId = body.tenantId ?? c.req.header("X-Tenant-ID") ?? "";

  type EvidenceItem = {
    type: string;
    controlRefs: string[];
    status: "pass" | "fail" | "unknown";
    details: Record<string, unknown>;
  };

  const unknownItems = (): EvidenceItem[] => [
    {
      type: "sso_enforcement",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.2.1"],
      status: "unknown",
      details: { reason: "Slack API error" },
    },
    {
      type: "retention_policy",
      controlRefs: ["GDPR-Art.5(1)(e)", "SOC2-CC6.6"],
      status: "unknown",
      details: {
        reason: "Slack API does not expose retention policy settings to bot tokens",
      },
    },
  ];

  try {
    const slackRes = await fetch("https://slack.com/api/team.info", {
      headers: { Authorization: `Bearer ${c.env.SLACK_BOT_TOKEN}` },
    });

    const data = await slackRes.json<{
      ok: boolean;
      team?: { id: string; name: string; enterprise_id?: string | null };
    }>();

    if (!data.ok || !data.team) {
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Slack team.info returned non-ok response",
        }),
      );
      return c.json({ items: unknownItems() });
    }

    const hasEnterprise = Boolean(data.team.enterprise_id);

    const items: EvidenceItem[] = [
      {
        type: "sso_enforcement",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.2.1"],
        status: hasEnterprise ? "pass" : "unknown",
        details: {
          enterpriseId: data.team.enterprise_id ?? null,
          reason: hasEnterprise
            ? "Team is part of an Enterprise Grid organization (SSO likely enforced)"
            : "Cannot determine SSO status without Enterprise Grid membership",
        },
      },
      {
        type: "retention_policy",
        controlRefs: ["GDPR-Art.5(1)(e)", "SOC2-CC6.6"],
        status: "unknown",
        details: {
          reason: "Slack API does not expose retention policy settings to bot tokens",
        },
      },
    ];

    return c.json({ items });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Failed to collect Slack evidence",
        error: err instanceof Error ? err.message : "Unknown error",
      }),
    );
    return c.json({ items: unknownItems() });
  }
});

export default app;
