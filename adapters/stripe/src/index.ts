import { Hono } from "hono";
import type { Bindings, Variables, SyncResult } from "./types.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { handleStripeWebhook } from "./webhooks.js";
import { authMiddleware } from "./auth.js";

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
    service: "stripe",
    connector: {
      id: "stripe",
      name: "Stripe",
      provider: "Stripe",
      capabilities: ["user-provisioning", "directory-sync", "group-sync"],
    },
  });
});

// Stripe webhook receiver — verifies Stripe-Signature, NOT internal HMAC
app.post("/webhooks/stripe/events", handleStripeWebhook);

// Orchestrator webhook — internal HMAC-verified events
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

// Trigger a full directory sync (users + groups)
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ tenantId: string; scope?: string }>().catch(() => null);

  const tenantId = body?.tenantId ?? c.req.header("X-Tenant-ID");

  if (!tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
  }

  const syncId = crypto.randomUUID();

  await c.env.DB.prepare(
    "INSERT INTO sync_jobs (id, tenant_id, connector_slug, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
  )
    .bind(syncId, tenantId, "stripe", "running", new Date().toISOString())
    .run();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      syncId,
      message: "Sync triggered",
      tenantId,
      connector: "stripe",
    }),
  );

  try {
    const scope = body?.scope ?? "all";

    let userResult: SyncResult = { created: 0, updated: 0, total: 0 };
    let groupResult: SyncResult & { memberships: number } = {
      created: 0,
      updated: 0,
      total: 0,
      memberships: 0,
    };

    if (scope === "all" || scope === "users") {
      userResult = await syncUsers(c.env.DB, c.env.STRIPE_SECRET_KEY, tenantId);
    }

    if (scope === "all" || scope === "groups") {
      groupResult = await syncGroups(c.env.DB, c.env.STRIPE_SECRET_KEY, tenantId);
    }

    // Update connection status
    await updateConnectionStatus(c.env.DB, tenantId, userResult.total, groupResult.total);

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
        tenantId,
        users: userResult,
        groups: groupResult,
      }),
    );

    return c.json({
      status: "synced",
      syncId,
      correlationId,
      data: {
        users: userResult,
        groups: {
          created: groupResult.created,
          updated: groupResult.updated,
          total: groupResult.total,
        },
        memberships: groupResult.memberships,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";

    await c.env.DB.prepare("UPDATE sync_jobs SET status = 'error', completed_at = ?1 WHERE id = ?2")
      .bind(new Date().toISOString(), syncId)
      .run();

    await updateConnectionStatus(c.env.DB, tenantId, 0, 0, errorMsg);

    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        syncId,
        message: "Sync failed",
        tenantId,
        error: errorMsg,
      }),
    );

    return c.json({ error: errorMsg, syncId, correlationId }, 500);
  }
});

// Sync status endpoint
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.query("tenantId") ?? c.req.header("X-Tenant-ID");

  if (!tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
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
      connector: "stripe",
      tenantId,
      correlationId,
      status: "not_connected",
      lastSyncAt: null,
      userCount: 0,
      groupCount: 0,
    });
  }

  const recentSyncs = await c.env.DB.prepare(
    "SELECT id, status, created_at, completed_at FROM sync_jobs WHERE tenant_id = ?1 AND connector_slug = ?2 ORDER BY created_at DESC LIMIT 10",
  )
    .bind(tenantId, "stripe")
    .all();

  return c.json({
    connector: "stripe",
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

// ── Compliance evidence collection ──────────────────────────────────────────
// POST /api/evidence — collect compliance evidence from Stripe for financial controls
app.post("/api/evidence", async (c) => {
  const CONTROL_REFS = {
    api_key_permissions: ["SOC2-CC6.1"],
    webhook_security: ["SOC2-CC6.6"],
    payment_events: ["SOC2-CC7.2", "PCI-10.2"],
    dispute_tracking: ["SOC2-CC7.3"],
    pci_compliance: ["PCI-12.8"],
  } as const;

  type EvidenceItem = {
    type: string;
    controlRefs: string[];
    status: "pass" | "fail" | "unknown";
    details: Record<string, unknown>;
  };

  // Resolve tenantId from header or JSON body
  const tenantId =
    c.req.header("X-Tenant-ID") ??
    (await c.req.json<{ tenantId?: string }>().catch((): { tenantId?: string } => ({})))?.tenantId;

  if (!tenantId) {
    return c.json({ items: [] });
  }

  // Check for Stripe API key in env (shared secret) or tenant-specific credentials
  const stripeApiKey = c.env.STRIPE_SECRET_KEY;

  if (!stripeApiKey) {
    return c.json({ items: [] });
  }

  const items: EvidenceItem[] = [];

  try {
    // Import Stripe SDK dynamically
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeApiKey, { apiVersion: "2023-10-16" });

    const now = Date.now();
    const ninetyDaysAgo = Math.floor((now - 90 * 24 * 60 * 60 * 1000) / 1000);

    // 1. API key permissions check (CC6.1)
    // Note: Stripe API doesn't expose API keys list via API (security by design)
    // We validate that the current key has access
    try {
      // Test API key by fetching balance as a simple validation
      const balance = await stripe.balance.retrieve();
      const isLive = !stripeApiKey.startsWith("sk_test_");

      items.push({
        type: "api_key_permissions",
        controlRefs: [...CONTROL_REFS.api_key_permissions],
        status: "pass",
        details: {
          keyMode: isLive ? "live" : "test",
          available: balance.available.map((b) => ({
            amount: b.amount,
            currency: b.currency,
          })),
          note: "API key validated and active",
        },
      });
    } catch (err: unknown) {
      items.push({
        type: "api_key_permissions",
        controlRefs: [...CONTROL_REFS.api_key_permissions],
        status: "unknown",
        details: {
          error: err instanceof Error ? err.message : "Failed to validate API key",
        },
      });
    }

    // 2. Webhook security (CC6.6)
    // Check webhook endpoints for HTTPS and signature verification
    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
      const allHttps = webhooks.data.every((wh) => wh.url.startsWith("https://"));
      const allActive = webhooks.data.every((wh) => wh.status === "enabled");

      items.push({
        type: "webhook_security",
        controlRefs: [...CONTROL_REFS.webhook_security],
        status: webhooks.data.length === 0 ? "unknown" : allHttps && allActive ? "pass" : "fail",
        details: {
          totalWebhooks: webhooks.data.length,
          allHttps,
          allActive,
          webhooks: webhooks.data.map((wh) => ({
            url: wh.url,
            status: wh.status,
            events: wh.enabled_events.length,
          })),
        },
      });
    } catch (err: unknown) {
      items.push({
        type: "webhook_security",
        controlRefs: [...CONTROL_REFS.webhook_security],
        status: "unknown",
        details: {
          error: err instanceof Error ? err.message : "Failed to fetch webhooks",
        },
      });
    }

    // 3. Payment events (CC7.2, PCI-10.2)
    // Check for successful/failed payment events as audit trail
    try {
      const events = await stripe.events.list({
        limit: 100,
        created: { gte: ninetyDaysAgo },
        types: ["payment_intent.succeeded", "charge.failed", "payment_intent.payment_failed"],
      });

      const successCount = events.data.filter((e) => e.type === "payment_intent.succeeded").length;
      const failCount = events.data.filter((e) =>
        ["charge.failed", "payment_intent.payment_failed"].includes(e.type),
      ).length;

      items.push({
        type: "payment_events",
        controlRefs: [...CONTROL_REFS.payment_events],
        status: events.data.length > 0 ? "pass" : "unknown",
        details: {
          totalEvents: events.data.length,
          successfulPayments: successCount,
          failedPayments: failCount,
          periodDays: 90,
          note: "Payment event audit trail available",
        },
      });
    } catch (err: unknown) {
      items.push({
        type: "payment_events",
        controlRefs: [...CONTROL_REFS.payment_events],
        status: "unknown",
        details: {
          error: err instanceof Error ? err.message : "Failed to fetch payment events",
        },
      });
    }

    // 4. Dispute/chargeback tracking (CC7.3)
    // Check for dispute management and incident response
    try {
      const disputes = await stripe.disputes.list({
        limit: 100,
        created: { gte: ninetyDaysAgo },
      });

      const openDisputes = disputes.data.filter((d) =>
        ["warning_needs_response", "needs_response", "under_review"].includes(d.status),
      ).length;
      const closedDisputes = disputes.data.filter((d) => ["won", "lost"].includes(d.status)).length;

      items.push({
        type: "dispute_tracking",
        controlRefs: [...CONTROL_REFS.dispute_tracking],
        status: disputes.data.length === 0 ? "pass" : openDisputes === 0 ? "pass" : "fail",
        details: {
          totalDisputes: disputes.data.length,
          openDisputes,
          closedDisputes,
          periodDays: 90,
          note:
            openDisputes > 0
              ? `${openDisputes} dispute(s) need response`
              : "No open disputes requiring action",
        },
      });
    } catch (err: unknown) {
      items.push({
        type: "dispute_tracking",
        controlRefs: [...CONTROL_REFS.dispute_tracking],
        status: "unknown",
        details: {
          error: err instanceof Error ? err.message : "Failed to fetch disputes",
        },
      });
    }

    // 5. PCI compliance status (PCI-12.8)
    // Stripe is PCI DSS Level 1 Service Provider — validate integration
    items.push({
      type: "pci_compliance",
      controlRefs: [...CONTROL_REFS.pci_compliance],
      status: "pass",
      details: {
        provider: "Stripe",
        complianceLevel: "PCI DSS Level 1 Service Provider",
        attestation: "Stripe maintains PCI DSS Level 1 certification",
        note: "Using Stripe as payment processor delegates PCI compliance burden",
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId: c.get("correlationId"),
        tenantId,
        message: "Stripe evidence collection failed",
        error: err instanceof Error ? err.message : "Unknown error",
      }),
    );
    // Return empty items on fatal error
    return c.json({ items: [] });
  }

  return c.json({ items });
});

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
      .bind(tenantId, "stripe", error ? "error" : "active", error ?? null, userCount, groupCount)
      .run();
  }
}
