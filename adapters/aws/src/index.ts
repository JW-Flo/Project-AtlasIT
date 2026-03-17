import { Hono } from "hono";
import type { Bindings, AwsConfig, SyncResult } from "./types.js";
import { authMiddleware } from "./auth.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { publishEvent } from "./event-publisher.js";

type Variables = {
  correlationId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// --- Middleware ---

// Correlation ID
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

// Security headers
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

// Auth on /api/* routes
app.use("/api/*", authMiddleware);

// Per-tenant rate limiting on /api/*
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

// --- Helper ---

function buildAwsConfig(env: Bindings): AwsConfig {
  return {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION ?? "us-east-1",
  };
}

// --- Routes ---

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "aws-connector",
    connector: {
      id: c.env.CONNECTOR_ID ?? "aws",
      name: "AWS",
      provider: "Amazon Web Services",
      capabilities: [
        "user-provisioning",
        "user-deprovisioning",
        "group-management",
      ],
      syncMode: "polling",
    },
  });
});

// Webhook receiver from orchestrator (HMAC-verified)
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

// Trigger a full directory sync (users + groups + memberships)
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const config = buildAwsConfig(c.env);

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Starting AWS IAM directory sync",
      region: config.region,
    }),
  );

  try {
    // Users must sync before groups (memberships reference user rows)
    const userResult = await syncUsers(config, c.env.DB, tenantId);
    const groupResult = await syncGroups(config, c.env.DB, tenantId);

    const result: SyncResult = {
      users: userResult,
      groups: groupResult,
    };

    // Update connection status
    await updateConnectionStatus(
      c.env.DB,
      tenantId,
      userResult.total,
      groupResult.total,
    );

    // Publish sync-completed event to orchestrator
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: "directory.sync.completed",
      source: "adapter-aws",
      correlationId,
      payload: result,
    }).catch((err) => {
      // Non-fatal: log but don't fail the sync
      console.error(
        JSON.stringify({
          level: "warn",
          correlationId,
          tenantId,
          message: "Failed to publish sync event",
          error: err instanceof Error ? err.message : "Unknown",
        }),
      );
    });

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "AWS IAM directory sync completed",
        users: result.users,
        groups: result.groups,
      }),
    );

    return c.json({ status: "synced", correlationId, data: result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";

    await updateConnectionStatus(c.env.DB, tenantId, 0, 0, errorMsg);

    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "AWS IAM directory sync failed",
        error: errorMsg,
      }),
    );

    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// Sync users only
app.post("/api/sync/users", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const config = buildAwsConfig(c.env);

  try {
    const result = await syncUsers(config, c.env.DB, tenantId);
    return c.json({ status: "synced", correlationId, data: result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// Sync groups only
app.post("/api/sync/groups", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const config = buildAwsConfig(c.env);

  try {
    const result = await syncGroups(config, c.env.DB, tenantId);
    return c.json({ status: "synced", correlationId, data: result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// Connection status
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const connection = await c.env.DB.prepare(
    "SELECT status, error_msg, last_sync_at, user_count, group_count FROM directory_connections WHERE tenant_id = ?",
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
      status: "not_connected",
      lastSyncAt: null,
      userCount: 0,
      groupCount: 0,
      correlationId,
    });
  }

  return c.json({
    status: connection.status,
    error: connection.error_msg,
    lastSyncAt: connection.last_sync_at,
    userCount: connection.user_count,
    groupCount: connection.group_count,
    correlationId,
  });
});

// --- Internal helpers ---

async function updateConnectionStatus(
  db: D1Database,
  tenantId: string,
  userCount: number,
  groupCount: number,
  error?: string,
): Promise<void> {
  const existing = await db
    .prepare("SELECT id FROM directory_connections WHERE tenant_id = ?")
    .bind(tenantId)
    .first();

  if (existing) {
    await db
      .prepare(
        `UPDATE directory_connections
         SET status = ?, error_msg = ?, last_sync_at = datetime('now'),
             user_count = ?, group_count = ?, updated_at = datetime('now')
         WHERE tenant_id = ?`,
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
        `INSERT INTO directory_connections
         (tenant_id, provider, status, error_msg, last_sync_at, user_count, group_count)
         VALUES (?, ?, ?, ?, datetime('now'), ?, ?)`,
      )
      .bind(
        tenantId,
        "aws",
        error ? "error" : "active",
        error ?? null,
        userCount,
        groupCount,
      )
      .run();
  }
}

export default app;
