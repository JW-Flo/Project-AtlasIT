import { Hono } from "hono";
import type { Bindings, Variables, SyncResult } from "./types.js";
import { validateConfig } from "./config.js";
import { authMiddleware, getAuthorizationUrl, exchangeCodeForToken } from "./auth.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { handleConfluenceWebhook } from "./webhooks.js";

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
  c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
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
    !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  if (current.count >= limit) {
    return c.json({ error: "Rate limit exceeded", correlationId: c.get("correlationId") }, 429);
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
    service: "confluence",
    connector: {
      id: "confluence",
      name: "Confluence",
      provider: "Atlassian",
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
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
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
  const body = await c.req.json<{ tenantId: string; scope?: string }>().catch(() => null);

  if (!body?.tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
  }

  const syncId = crypto.randomUUID();

  // Record sync job in D1
  await c.env.DB.prepare(
    "INSERT INTO sync_jobs (id, tenant_id, connector_slug, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
  )
    .bind(syncId, body.tenantId, "confluence", "running", new Date().toISOString())
    .run();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      syncId,
      message: "Sync triggered",
      tenantId: body.tenantId,
      connector: "confluence",
    }),
  );

  // Retrieve stored OAuth token for this tenant
  const tokenRow = await c.env.DB.prepare(
    `SELECT access_token FROM connector_tokens
     WHERE tenant_id = ?1 AND connector_slug = 'confluence'
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ access_token: string }>();

  if (!tokenRow) {
    await c.env.DB.prepare("UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2")
      .bind(new Date().toISOString(), syncId)
      .run();
    return c.json(
      {
        error: "No OAuth token found for tenant. Authorize first.",
        correlationId,
      },
      400,
    );
  }

  // Retrieve config
  const configRow = await c.env.DB.prepare(
    `SELECT config FROM connector_configs
     WHERE tenant_id = ?1 AND connector_slug = 'confluence' LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ config: string }>();

  if (!configRow) {
    await c.env.DB.prepare("UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2")
      .bind(new Date().toISOString(), syncId)
      .run();
    return c.json(
      {
        error: "No connector config found. Configure cloudId first.",
        correlationId,
      },
      400,
    );
  }

  const config = JSON.parse(configRow.config) as { cloudId: string };
  const validation = validateConfig(config as unknown as Record<string, unknown>);
  if (!validation.valid) {
    return c.json({ error: "Invalid config", details: validation.errors, correlationId }, 400);
  }

  try {
    const scope = body.scope ?? "all";

    let userResult: SyncResult = { created: 0, updated: 0, total: 0 };
    let groupResult: SyncResult = { created: 0, updated: 0, total: 0 };

    if (scope === "all" || scope === "users") {
      userResult = await syncUsers(tokenRow.access_token, config.cloudId, c.env.DB, body.tenantId);
    }

    if (scope === "all" || scope === "groups") {
      groupResult = await syncGroups(
        tokenRow.access_token,
        config.cloudId,
        c.env.DB,
        body.tenantId,
      );
    }

    // Update connection status
    await updateConnectionStatus(c.env.DB, body.tenantId, userResult.total, groupResult.total);

    // Mark sync job complete
    await c.env.DB.prepare(
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

    await c.env.DB.prepare("UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2")
      .bind(new Date().toISOString(), syncId)
      .run();

    await updateConnectionStatus(c.env.DB, body.tenantId, 0, 0, errorMsg);

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

// Status endpoint
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "tenantId query parameter is required", correlationId }, 400);
  }

  const connection = await c.env.DB.prepare(
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
      connector: "confluence",
      tenantId,
      correlationId,
      status: "not_connected",
      lastSyncAt: null,
      userCount: 0,
      groupCount: 0,
    });
  }

  const recentSyncs = await c.env.DB.prepare(
    `SELECT id, status, created_at, completed_at
     FROM sync_jobs WHERE tenant_id = ?1 AND connector_slug = 'confluence'
     ORDER BY created_at DESC LIMIT 10`,
  )
    .bind(tenantId)
    .all();

  return c.json({
    connector: "confluence",
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

// OAuth2 authorization redirect
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

// OAuth2 callback
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
      `INSERT INTO connector_tokens (id, tenant_id, connector_slug, access_token, refresh_token, expires_at, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
      .bind(
        crypto.randomUUID(),
        stateData.tenantId,
        "confluence",
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
        connector: "confluence",
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

// Provision a user in Confluence (JML: Joiner/Mover)
app.post("/api/provision", async (c) => {
  const correlationId = c.get("correlationId");
  const raw = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const body = raw
    ? {
        tenantId: raw.tenantId as string,
        email:
          ((raw.userProfile as Record<string, unknown>)?.email as string) ?? (raw.email as string),
        displayName:
          ((raw.userProfile as Record<string, unknown>)?.displayName as string) ??
          (raw.displayName as string) ??
          undefined,
        groups: (raw.groups ?? (raw.config as Record<string, unknown>)?.groups) as
          | string[]
          | undefined,
      }
    : null;

  if (!body?.tenantId || !body?.email) {
    return c.json({ error: "tenantId and email are required", correlationId }, 400);
  }

  const tokenRow = await c.env.DB.prepare(
    `SELECT access_token FROM connector_tokens
     WHERE tenant_id = ?1 AND connector_slug = 'confluence'
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ access_token: string }>();

  if (!tokenRow) {
    return c.json({ error: "No OAuth token found for tenant", correlationId }, 400);
  }

  try {
    // Get accessible Atlassian sites
    const sitesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: { Authorization: `Bearer ${tokenRow.access_token}`, Accept: "application/json" },
    });
    if (!sitesRes.ok) {
      return c.json({ error: "Failed to fetch Atlassian sites", correlationId }, 502);
    }
    const sites = (await sitesRes.json()) as Array<{ id: string; name: string }>;
    if (sites.length === 0) {
      return c.json({ error: "No accessible Atlassian sites", correlationId }, 400);
    }
    const cloudId = sites[0].id;

    // Search for user by email
    const searchRes = await fetch(
      `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api/search?cql=${encodeURIComponent(`type=user AND user.email="${body.email}"`)}`,
      { headers: { Authorization: `Bearer ${tokenRow.access_token}`, Accept: "application/json" } },
    );

    let userExists = false;
    if (searchRes.ok) {
      const searchData = (await searchRes.json()) as { results?: unknown[] };
      userExists = (searchData.results?.length ?? 0) > 0;
    }

    // Confluence Cloud doesn't support direct user creation via REST API —
    // users are managed at the Atlassian org level. We can add to groups if they exist.
    if (userExists && body.groups?.length) {
      for (const group of body.groups) {
        await fetch(
          `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api/group/${encodeURIComponent(group)}/member`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenRow.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accountId: body.email }),
          },
        );
      }
    }

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        message: userExists
          ? "User found, groups updated"
          : "User not found in Confluence (invite required at org level)",
        email: body.email,
        tenantId: body.tenantId,
      }),
    );

    return c.json({
      status: userExists ? "provisioned" : "pending_invite",
      correlationId,
      email: body.email,
      message: userExists
        ? "User access configured in Confluence"
        : "User not found — invite via Atlassian Admin required",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({ level: "error", correlationId, message: "Provision failed", error: msg }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
});

// Deprovision a user from Confluence (JML: Leaver)
app.post("/api/deprovision", async (c) => {
  const correlationId = c.get("correlationId");
  const raw = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const body = raw
    ? {
        tenantId: raw.tenantId as string,
        email:
          ((raw.userProfile as Record<string, unknown>)?.email as string) ?? (raw.email as string),
      }
    : null;

  if (!body?.tenantId || !body?.email) {
    return c.json({ error: "tenantId and email are required", correlationId }, 400);
  }

  const tokenRow = await c.env.DB.prepare(
    `SELECT access_token FROM connector_tokens
     WHERE tenant_id = ?1 AND connector_slug = 'confluence'
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(body.tenantId)
    .first<{ access_token: string }>();

  if (!tokenRow) {
    return c.json({ error: "No OAuth token found for tenant", correlationId }, 400);
  }

  try {
    const sitesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: { Authorization: `Bearer ${tokenRow.access_token}`, Accept: "application/json" },
    });
    if (!sitesRes.ok) {
      return c.json({ error: "Failed to fetch Atlassian sites", correlationId }, 502);
    }
    const sites = (await sitesRes.json()) as Array<{ id: string }>;
    if (sites.length === 0) {
      return c.json({ error: "No accessible Atlassian sites", correlationId }, 400);
    }
    const cloudId = sites[0].id;

    // Search for user
    const searchRes = await fetch(
      `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api/search?cql=${encodeURIComponent(`type=user AND user.email="${body.email}"`)}`,
      { headers: { Authorization: `Bearer ${tokenRow.access_token}`, Accept: "application/json" } },
    );

    if (!searchRes.ok) {
      return c.json({
        status: "skipped",
        correlationId,
        message: "Could not search for user in Confluence",
      });
    }

    const searchData = (await searchRes.json()) as {
      results?: Array<{ user?: { accountId?: string } }>;
    };
    const accountId = searchData.results?.[0]?.user?.accountId;

    // Full user deactivation requires Atlassian Organization Admin API.
    // We can remove from all groups to revoke Confluence-specific access.
    if (accountId) {
      const groupsRes = await fetch(
        `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api/user/memberof?accountId=${encodeURIComponent(accountId)}`,
        {
          headers: { Authorization: `Bearer ${tokenRow.access_token}`, Accept: "application/json" },
        },
      );
      if (groupsRes.ok) {
        const groupsData = (await groupsRes.json()) as { results?: Array<{ name: string }> };
        for (const group of groupsData.results ?? []) {
          await fetch(
            `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api/group/${encodeURIComponent(group.name)}/member/${encodeURIComponent(accountId)}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${tokenRow.access_token}` },
            },
          );
        }
      }
    }

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        message: accountId
          ? "User removed from all Confluence groups"
          : "User not found in Confluence",
        email: body.email,
        tenantId: body.tenantId,
      }),
    );

    return c.json({
      status: accountId ? "deprovisioned" : "not_found",
      correlationId,
      email: body.email,
      message: accountId
        ? "User removed from all Confluence groups (full deactivation requires Org Admin API)"
        : "User not found in Confluence",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({ level: "error", correlationId, message: "Deprovision failed", error: msg }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
});

// Confluence webhook receiver
app.post("/webhooks/confluence/events", (c) => handleConfluenceWebhook(c));

export default app;

// -- Internal helpers --

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
      .bind(error ? "error" : "active", error ?? null, userCount, groupCount, tenantId)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO directory_connections (tenant_id, provider, status, error_msg, last_sync_at, user_count, group_count)
         VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5, ?6)`,
      )
      .bind(
        tenantId,
        "confluence",
        error ? "error" : "active",
        error ?? null,
        userCount,
        groupCount,
      )
      .run();
  }
}
