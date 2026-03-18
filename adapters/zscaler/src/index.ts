import { Hono } from "hono";
import type { Bindings, Variables, SyncResult, CanonicalUserProfile } from "./types.js";
import { validateConfig } from "./config.js";
import { authMiddleware, getZscalerToken, buildBaseUrl, createZscalerFetch } from "./auth.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";

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
// Auth + rate-limit on /api/* routes
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
// Health endpoint
// ---------------------------------------------------------------------------
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "zscaler",
    connector: {
      id: "zscaler",
      name: "Zscaler",
      provider: "Zscaler",
      capabilities: [
        "user-provisioning",
        "user-deprovisioning",
        "directory-sync",
        "role-management",
      ],
    },
  });
});

// ---------------------------------------------------------------------------
// Webhook receiver from orchestrator (internal)
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

  const body = JSON.parse(rawBody) as { type?: string; tenantId?: string };

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
// POST /api/provision — create user in ZIdentity
// ---------------------------------------------------------------------------
app.post("/api/provision", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req
    .json<{ tenantId: string; userProfile: CanonicalUserProfile; config?: Record<string, string> }>()
    .catch(() => null);

  if (!body?.tenantId || !body?.userProfile) {
    return c.json({ error: "tenantId and userProfile are required", correlationId }, 400);
  }

  const config = await resolveConfig(c.env, body.tenantId, body.config, c.env.ATLAS_SHARED_DB);
  if (!config) {
    return c.json({ error: "No Zscaler connector config found for tenant", correlationId }, 400);
  }

  const { clientId, clientSecret, vanityDomain, cloud } = config;
  const token = await getZscalerToken(clientId, clientSecret, vanityDomain, cloud, c.env.KV_CACHE);
  const zfetch = createZscalerFetch(token);
  const baseUrl = buildBaseUrl(vanityDomain, cloud);

  const { userProfile } = body;
  const nameParts = [userProfile.firstName, userProfile.lastName]
    .filter(Boolean)
    .join(" ");
  const displayName = userProfile.displayName ?? (nameParts || userProfile.email);

  const createBody = {
    loginName: userProfile.email,
    displayName,
    primaryEmail: userProfile.email,
    status: "ACTIVE",
  };

  const res = await zfetch(`${baseUrl}/admin/api/v1/users`, {
    method: "POST",
    body: JSON.stringify(createBody),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Zscaler provision failed",
        tenantId: body.tenantId,
        status: res.status,
        response: text,
      }),
    );
    return c.json({ error: `Zscaler provision failed: ${res.status}`, correlationId }, 500);
  }

  const created = await res.json();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "User provisioned",
      tenantId: body.tenantId,
      email: userProfile.email,
    }),
  );

  return c.json({ status: "provisioned", correlationId, user: created });
});

// ---------------------------------------------------------------------------
// POST /api/deprovision — deactivate/delete user in ZIdentity
// ---------------------------------------------------------------------------
app.post("/api/deprovision", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req
    .json<{ tenantId: string; userProfile: CanonicalUserProfile; config?: Record<string, string> }>()
    .catch(() => null);

  if (!body?.tenantId || !body?.userProfile?.email) {
    return c.json({ error: "tenantId and userProfile.email are required", correlationId }, 400);
  }

  const config = await resolveConfig(c.env, body.tenantId, body.config, c.env.ATLAS_SHARED_DB);
  if (!config) {
    return c.json({ error: "No Zscaler connector config found for tenant", correlationId }, 400);
  }

  const { clientId, clientSecret, vanityDomain, cloud } = config;
  const token = await getZscalerToken(clientId, clientSecret, vanityDomain, cloud, c.env.KV_CACHE);
  const zfetch = createZscalerFetch(token);
  const baseUrl = buildBaseUrl(vanityDomain, cloud);

  // Look up user ID by email via list with filter
  const listRes = await zfetch(
    `${baseUrl}/admin/api/v1/users?pageSize=10&page=0`,
  );

  if (!listRes.ok) {
    const text = await listRes.text();
    return c.json({ error: `Failed to look up user: ${listRes.status} ${text}`, correlationId }, 500);
  }

  // Find the user from the directory_users table (populated by sync)
  const userRow = await c.env.ATLAS_SHARED_DB
    .prepare(
      `SELECT provider_id FROM directory_users
       WHERE tenant_id = ?1 AND email = ?2 AND source = 'zscaler' LIMIT 1`,
    )
    .bind(body.tenantId, body.userProfile.email)
    .first<{ provider_id: string }>();

  if (!userRow) {
    return c.json(
      { error: "User not found in Zscaler directory. Run sync first.", correlationId },
      404,
    );
  }

  const userId = userRow.provider_id;

  // Deactivate the user
  const updateRes = await zfetch(`${baseUrl}/admin/api/v1/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "INACTIVE" }),
  });

  if (!updateRes.ok) {
    const text = await updateRes.text();
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Zscaler deprovision failed",
        tenantId: body.tenantId,
        userId,
        status: updateRes.status,
        response: text,
      }),
    );
    return c.json({ error: `Zscaler deprovision failed: ${updateRes.status}`, correlationId }, 500);
  }

  // Update local directory
  await c.env.ATLAS_SHARED_DB
    .prepare(
      `UPDATE directory_users SET status = 'inactive', updated_at = datetime('now')
       WHERE tenant_id = ?1 AND provider_id = ?2 AND source = 'zscaler'`,
    )
    .bind(body.tenantId, userId)
    .run();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "User deprovisioned",
      tenantId: body.tenantId,
      email: body.userProfile.email,
      userId,
    }),
  );

  return c.json({ status: "deprovisioned", correlationId, userId });
});

// ---------------------------------------------------------------------------
// POST /api/sync — full directory sync (users + groups)
// ---------------------------------------------------------------------------
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req
    .json<{ tenantId: string; scope?: string }>()
    .catch(() => null);

  if (!body?.tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
  }

  const syncId = crypto.randomUUID();

  await c.env.ATLAS_SHARED_DB.prepare(
    "INSERT INTO sync_jobs (id, tenant_id, connector_slug, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
  )
    .bind(syncId, body.tenantId, "zscaler", "running", new Date().toISOString())
    .run();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      syncId,
      message: "Sync triggered",
      tenantId: body.tenantId,
      connector: "zscaler",
    }),
  );

  const configRow = await c.env.ATLAS_SHARED_DB.prepare(
    `SELECT config FROM connector_configs
     WHERE tenant_id = ?1 AND connector_slug = 'zscaler' LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ config: string }>();

  if (!configRow) {
    await c.env.ATLAS_SHARED_DB.prepare(
      "UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2",
    )
      .bind(new Date().toISOString(), syncId)
      .run();
    return c.json(
      {
        error: "No connector config found. Configure clientId, clientSecret, vanityDomain, cloud, and customerId first.",
        correlationId,
      },
      400,
    );
  }

  const config = JSON.parse(configRow.config) as {
    clientId: string;
    clientSecret: string;
    vanityDomain: string;
    cloud: string;
    customerId: string;
  };

  const validation = validateConfig(config as unknown as Record<string, unknown>);
  if (!validation.valid) {
    await c.env.ATLAS_SHARED_DB.prepare(
      "UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2",
    )
      .bind(new Date().toISOString(), syncId)
      .run();
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
        config.clientId,
        config.clientSecret,
        config.vanityDomain,
        config.cloud,
        config.customerId,
        c.env.ATLAS_SHARED_DB,
        c.env.KV_CACHE,
        body.tenantId,
      );
    }

    if (scope === "all" || scope === "groups") {
      groupResult = await syncGroups(
        config.clientId,
        config.clientSecret,
        config.vanityDomain,
        config.cloud,
        config.customerId,
        c.env.ATLAS_SHARED_DB,
        c.env.KV_CACHE,
        body.tenantId,
      );
    }

    await updateConnectionStatus(
      c.env.ATLAS_SHARED_DB,
      body.tenantId,
      userResult.total,
      groupResult.total,
    );

    await c.env.ATLAS_SHARED_DB.prepare(
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

    await c.env.ATLAS_SHARED_DB.prepare(
      "UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2",
    )
      .bind(new Date().toISOString(), syncId)
      .run();

    await updateConnectionStatus(c.env.ATLAS_SHARED_DB, body.tenantId, 0, 0, errorMsg);

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

// ---------------------------------------------------------------------------
// POST /api/roles/:roleId/members — add user to ZPA SCIM group
// ---------------------------------------------------------------------------
app.post("/api/roles/:roleId/members", async (c) => {
  const correlationId = c.get("correlationId");
  const roleId = c.req.param("roleId");
  const body = await c.req
    .json<{ tenantId: string; userId: string; userProfile?: CanonicalUserProfile }>()
    .catch(() => null);

  if (!body?.tenantId || !body?.userId) {
    return c.json({ error: "tenantId and userId are required", correlationId }, 400);
  }

  const config = await resolveConfig(c.env, body.tenantId, undefined, c.env.ATLAS_SHARED_DB);
  if (!config) {
    return c.json({ error: "No Zscaler connector config found for tenant", correlationId }, 400);
  }

  const { clientId, clientSecret, vanityDomain, cloud } = config;
  const token = await getZscalerToken(clientId, clientSecret, vanityDomain, cloud, c.env.KV_CACHE);
  const zfetch = createZscalerFetch(token);
  const baseUrl = buildBaseUrl(vanityDomain, cloud);

  // Add user to ZIdentity group (roleId is the group ID)
  const res = await zfetch(
    `${baseUrl}/admin/api/v1/groups/${roleId}/users/${body.userId}`,
    { method: "POST" },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Add to group failed",
        tenantId: body.tenantId,
        roleId,
        userId: body.userId,
        status: res.status,
        response: text,
      }),
    );
    return c.json({ error: `Failed to add user to group: ${res.status}`, correlationId }, 500);
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "User added to group",
      tenantId: body.tenantId,
      roleId,
      userId: body.userId,
    }),
  );

  return c.json({ status: "added", correlationId, roleId, userId: body.userId });
});

// ---------------------------------------------------------------------------
// DELETE /api/roles/:roleId/members — remove user from ZPA SCIM group
// ---------------------------------------------------------------------------
app.delete("/api/roles/:roleId/members", async (c) => {
  const correlationId = c.get("correlationId");
  const roleId = c.req.param("roleId");
  const body = await c.req
    .json<{ tenantId: string; userId: string }>()
    .catch(() => null);

  if (!body?.tenantId || !body?.userId) {
    return c.json({ error: "tenantId and userId are required", correlationId }, 400);
  }

  const config = await resolveConfig(c.env, body.tenantId, undefined, c.env.ATLAS_SHARED_DB);
  if (!config) {
    return c.json({ error: "No Zscaler connector config found for tenant", correlationId }, 400);
  }

  const { clientId, clientSecret, vanityDomain, cloud } = config;
  const token = await getZscalerToken(clientId, clientSecret, vanityDomain, cloud, c.env.KV_CACHE);
  const zfetch = createZscalerFetch(token);
  const baseUrl = buildBaseUrl(vanityDomain, cloud);

  const res = await zfetch(
    `${baseUrl}/admin/api/v1/groups/${roleId}/users/${body.userId}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Remove from group failed",
        tenantId: body.tenantId,
        roleId,
        userId: body.userId,
        status: res.status,
        response: text,
      }),
    );
    return c.json({ error: `Failed to remove user from group: ${res.status}`, correlationId }, 500);
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "User removed from group",
      tenantId: body.tenantId,
      roleId,
      userId: body.userId,
    }),
  );

  return c.json({ status: "removed", correlationId, roleId, userId: body.userId });
});

// ---------------------------------------------------------------------------
// GET /api/status — connection status for a tenant
// ---------------------------------------------------------------------------
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "tenantId query parameter is required", correlationId }, 400);
  }

  const connection = await c.env.ATLAS_SHARED_DB.prepare(
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
      connector: "zscaler",
      tenantId,
      correlationId,
      status: "not_connected",
      lastSyncAt: null,
      userCount: 0,
      groupCount: 0,
    });
  }

  const recentSyncs = await c.env.ATLAS_SHARED_DB.prepare(
    `SELECT id, status, created_at, completed_at
     FROM sync_jobs WHERE tenant_id = ?1 AND connector_slug = 'zscaler'
     ORDER BY created_at DESC LIMIT 10`,
  )
    .bind(tenantId)
    .all();

  return c.json({
    connector: "zscaler",
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

export default app;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface ZscalerConfig {
  clientId: string;
  clientSecret: string;
  vanityDomain: string;
  cloud: string;
  customerId: string;
}

/**
 * Resolve connector config: prefer inline config from request body,
 * fall back to stored config in D1 (scoped by tenant_id).
 */
async function resolveConfig(
  env: Bindings,
  tenantId: string,
  inlineConfig: Record<string, string> | undefined,
  db: D1Database,
): Promise<ZscalerConfig | null> {
  if (inlineConfig?.clientId) {
    return {
      clientId: inlineConfig.clientId ?? env.ZSCALER_CLIENT_ID,
      clientSecret: inlineConfig.clientSecret ?? env.ZSCALER_CLIENT_SECRET,
      vanityDomain: inlineConfig.vanityDomain ?? env.ZSCALER_VANITY_DOMAIN,
      cloud: inlineConfig.cloud ?? env.ZSCALER_CLOUD,
      customerId: inlineConfig.customerId ?? env.ZSCALER_CUSTOMER_ID,
    };
  }

  // Try D1 connector_configs table
  const row = await db
    .prepare(
      `SELECT config FROM connector_configs
       WHERE tenant_id = ?1 AND connector_slug = 'zscaler' LIMIT 1`,
    )
    .bind(tenantId)
    .first<{ config: string }>();

  if (row) {
    return JSON.parse(row.config) as ZscalerConfig;
  }

  // Fall back to worker-level secrets (single-tenant deploy scenario)
  if (env.ZSCALER_CLIENT_ID && env.ZSCALER_CLIENT_SECRET) {
    return {
      clientId: env.ZSCALER_CLIENT_ID,
      clientSecret: env.ZSCALER_CLIENT_SECRET,
      vanityDomain: env.ZSCALER_VANITY_DOMAIN,
      cloud: env.ZSCALER_CLOUD,
      customerId: env.ZSCALER_CUSTOMER_ID,
    };
  }

  return null;
}

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
        "zscaler",
        error ? "error" : "active",
        error ?? null,
        userCount,
        groupCount,
      )
      .run();
  }
}
