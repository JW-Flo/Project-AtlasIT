import { Hono } from "hono";
import type { Bindings, SyncResult } from "./types.js";
import { syncDirectory } from "./sync.js";
import { handleVerification, handleEventHook } from "./webhooks.js";
import { scimRouter } from "./scim/router.js";

const app = new Hono<{ Bindings: Bindings }>();

// Mount SCIM 2.0 provisioning endpoints
app.route("/scim/v2", scimRouter);

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    service: "okta-connector",
    connectorId: c.env.CONNECTOR_ID,
  });
});

app.post("/api/sync", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const body = await c.req.json<{ orgUrl: string }>().catch(() => null);
  if (!body?.orgUrl) {
    return c.json({ error: "Missing orgUrl in request body" }, 400);
  }

  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Starting directory sync",
      orgUrl: body.orgUrl,
    }),
  );

  try {
    const result: SyncResult = await syncDirectory(
      c.env.DB,
      body.orgUrl,
      c.env.OKTA_API_TOKEN,
      tenantId,
    );

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "Directory sync completed",
        users: result.users,
        groups: result.groups,
      }),
    );

    return c.json({ status: "synced", correlationId, data: result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Directory sync failed",
        error: errorMsg,
      }),
    );
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

app.get("/api/status", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
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

  if (!connection) {
    return c.json({
      status: "not_connected",
      lastSyncAt: null,
      userCount: 0,
      groupCount: 0,
    });
  }

  return c.json({
    status: connection.status,
    error: connection.error_msg,
    lastSyncAt: connection.last_sync_at,
    userCount: connection.user_count,
    groupCount: connection.group_count,
  });
});

app.get("/webhooks/okta/events", (c) => handleVerification(c));

app.post("/webhooks/okta/events", (c) => handleEventHook(c));

export default app;
