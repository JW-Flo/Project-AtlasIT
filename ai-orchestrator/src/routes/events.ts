import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, AgentSubscription } from "../types";
import { signPayload, verifySignature } from "../lib/hmac";
import { moveToDeadLetter } from "../lib/dead-letter";
import {
  evaluateAutomationRules,
  type ActionContext,
} from "../lib/automation-evaluator";
import { classifyAndExecute, type DirectoryChange } from "../lib/jml-engine";

const PublishEventSchema = z.object({
  tenantId: z.string().min(1),
  type: z.string().min(1),
  source: z.string().min(1),
  payload: z.unknown().optional(),
  idempotencyKey: z.string().optional(),
});

/** Parse EVENT_SOURCE_SECRETS env var (JSON map of sourceId → secret). */
function getSourceSecrets(
  env: AppEnv["Bindings"],
): Record<string, string> | null {
  if (!env.EVENT_SOURCE_SECRETS) return null;
  try {
    return JSON.parse(env.EVENT_SOURCE_SECRETS) as Record<string, string>;
  } catch {
    return null;
  }
}

export const eventRoutes = new Hono<AppEnv>();

// POST /api/v1/events -- publish event and fan out
eventRoutes.post("/", async (c) => {
  // --- Inbound HMAC verification ---
  const signature = c.req.header("X-Signature");
  const requireSignatures = c.env.REQUIRE_EVENT_SIGNATURES === "true";
  const sourceSecrets = getSourceSecrets(c.env);

  if (signature) {
    // Signature present — verify it
    const rawBody = await c.req.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json(
        {
          status: "error",
          code: "INVALID_BODY",
          message: "Request body is not valid JSON",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        400,
      );
    }

    const source = (body as Record<string, unknown>).source as
      | string
      | undefined;
    const secret = source ? sourceSecrets?.[source] : undefined;

    if (!secret) {
      return c.json(
        {
          status: "error",
          code: "UNAUTHORIZED",
          message: "No secret configured for event source",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        401,
      );
    }

    const valid = await verifySignature(rawBody, signature, secret);
    if (!valid) {
      return c.json(
        {
          status: "error",
          code: "UNAUTHORIZED",
          message: "Invalid event signature",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        401,
      );
    }

    // Signature valid — continue with already-parsed body
    const parsed = PublishEventSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          status: "error",
          code: "VALIDATION_FAILED",
          message: "Invalid event",
          details: parsed.error.flatten(),
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        400,
      );
    }
    // Proceed below with parsed.data via c._parsedEvent
    (c as unknown as Record<string, unknown>)._parsedEvent = parsed.data;
  } else if (requireSignatures) {
    // No signature and signatures required — reject
    return c.json(
      {
        status: "error",
        code: "UNAUTHORIZED",
        message: "Event signature required",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      401,
    );
  }

  // Parse body (only if not already parsed from signature path)
  const alreadyParsed = (c as unknown as Record<string, unknown>)._parsedEvent;
  let parsed;
  if (alreadyParsed) {
    parsed = {
      success: true as const,
      data: alreadyParsed as z.infer<typeof PublishEventSchema>,
    };
  } else {
    const body = await c.req.json();
    parsed = PublishEventSchema.safeParse(body);
  }
  if (!parsed.success) {
    return c.json(
      {
        status: "error",
        code: "VALIDATION_FAILED",
        message: "Invalid event",
        details: parsed.error.flatten(),
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const { tenantId, type, source, payload, idempotencyKey } = parsed.data;

  // Idempotency check via KV (24h TTL)
  if (idempotencyKey) {
    const existing = await c.env.IDEMPOTENCY_CACHE.get(idempotencyKey);
    if (existing) {
      return c.json({
        status: "success",
        data: JSON.parse(existing),
        deduplicated: true,
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      });
    }
  }

  const eventId = crypto.randomUUID();

  // Store event in D1
  await c.env.DB.prepare(
    "INSERT INTO events (id, tenant_id, type, source, payload, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      eventId,
      tenantId,
      type,
      source,
      payload ? JSON.stringify(payload) : null,
      "pending",
      idempotencyKey ?? null,
    )
    .run();

  // Cache idempotency key
  if (idempotencyKey) {
    await c.env.IDEMPOTENCY_CACHE.put(
      idempotencyKey,
      JSON.stringify({ id: eventId, status: "pending" }),
      { expirationTtl: 86400 },
    );
  }

  // Fan out to subscribed agents (async, non-blocking)
  const subscribers = await c.env.DB.prepare(
    `SELECT ar.id as agentId, ar.name as agentName, ar.webhook_url as webhookUrl, ar.secret, es.event_type as eventType
     FROM agent_registry ar
     JOIN event_subscriptions es ON ar.id = es.agent_id
     WHERE es.event_type = ? AND ar.status = 'active'`,
  )
    .bind(type)
    .all();

  if (subscribers.results.length > 0) {
    // Use waitUntil for non-blocking delivery
    const ctx = c.executionCtx;
    ctx.waitUntil(
      fanOutToAgents(
        c.env,
        eventId,
        tenantId,
        type,
        source,
        payload,
        subscribers.results as unknown as AgentSubscription[],
        c.get("correlationId"),
      ),
    );
  }

  // Evaluate automation rules for this event (async, non-blocking).
  // Rules and execution records live in ATLAS_SHARED_DB (same DB as the console-app).
  const sharedDb = c.env.ATLAS_SHARED_DB ?? c.env.DB;
  const adapterUrls = (() => {
    try {
      return JSON.parse(c.env.ADAPTER_URLS ?? "{}") as Record<string, string>;
    } catch {
      return {};
    }
  })();
  const actionContext: ActionContext = {
    workflow: c.env.WORKFLOW,
    selfUrl: c.env.SELF_URL,
    adapterUrls,
    sharedDb,
  };
  try {
    const ctx2 = c.executionCtx;
    ctx2.waitUntil(
      evaluateAutomationRules(
        sharedDb,
        tenantId,
        type,
        source,
        payload,
        c.env.AUTOMATION,
        actionContext,
      ).catch((err) => {
        console.error(
          JSON.stringify({
            level: "error",
            message: "Automation rule evaluation failed",
            eventId,
            tenantId,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }),
    );
  } catch {
    // No ExecutionContext available (e.g. in tests) — run synchronously
    evaluateAutomationRules(
      sharedDb,
      tenantId,
      type,
      source,
      payload,
      c.env.AUTOMATION,
      actionContext,
    ).catch(() => {});
  }

  // ── Zero-config JML: auto-detect user lifecycle events ────────────────────
  const JML_EVENT_MAP: Record<string, DirectoryChange["changeType"]> = {
    "user.created": "created",
    "user.provisioned": "created",
    "user.deactivated": "deactivated",
    "user.suspended": "deactivated",
    "user.deleted": "deleted",
    "user.reactivated": "reactivated",
    "user.profile_updated": "updated",
  };

  const jmlChangeType = JML_EVENT_MAP[type];
  if (jmlChangeType) {
    const jmlPayload = (payload ?? {}) as Record<string, unknown>;
    const jmlChange: DirectoryChange = {
      userId:
        (jmlPayload.userId as string) ?? (jmlPayload.id as string) ?? "unknown",
      email: jmlPayload.email as string | undefined,
      changeType: jmlChangeType,
      delta:
        (jmlPayload.delta as Record<
          string,
          { old?: unknown; new?: unknown }
        >) ?? {},
      source,
    };

    const jmlPromise = classifyAndExecute(tenantId, jmlChange, {
      db: sharedDb,
      workflow: c.env.WORKFLOW,
      adapterUrls,
      selfUrl: c.env.SELF_URL,
    }).catch((err) => {
      console.error(
        JSON.stringify({
          level: "error",
          message: "JML auto-detection failed",
          eventId,
          tenantId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    });

    try {
      c.executionCtx.waitUntil(jmlPromise);
    } catch {
      // No execution context (tests) — fire and forget
    }
  }

  // Mark event as processing
  await c.env.DB.prepare("UPDATE events SET status = 'processing' WHERE id = ?")
    .bind(eventId)
    .run();

  return c.json(
    {
      status: "success",
      data: {
        id: eventId,
        type,
        source,
        status: "processing",
        subscriberCount: subscribers.results.length,
      },
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// GET /api/v1/events -- list events
eventRoutes.get("/", async (c) => {
  const status = c.req.query("status");
  const type = c.req.query("type");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 100);
  const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (type) {
    conditions.push("type = ?");
    params.push(type);
  }
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const results = await c.env.DB.prepare(
    `SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    status: "success",
    data: results.results,
    meta: { limit, offset },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/events/:id -- get event with delivery status
eventRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const event = await c.env.DB.prepare("SELECT * FROM events WHERE id = ?")
    .bind(id)
    .first();

  if (!event) {
    return c.json(
      {
        status: "error",
        code: "NOT_FOUND",
        message: "Event not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  const deliveries = await c.env.DB.prepare(
    "SELECT * FROM event_deliveries WHERE event_id = ?",
  )
    .bind(id)
    .all();

  return c.json({
    status: "success",
    data: { ...event, deliveries: deliveries.results },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

async function fanOutToAgents(
  env: AppEnv["Bindings"],
  eventId: string,
  tenantId: string,
  type: string,
  source: string,
  payload: unknown,
  agents: AgentSubscription[],
  correlationId: string,
): Promise<void> {
  const eventBody = JSON.stringify({
    eventId,
    tenantId,
    type,
    source,
    payload,
    timestamp: new Date().toISOString(),
  });

  const deliveryPromises = agents.map(async (agent) => {
    const deliveryId = crypto.randomUUID();

    // Record delivery attempt
    await env.DB.prepare(
      "INSERT INTO event_deliveries (id, event_id, agent_id, status, attempts) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(deliveryId, eventId, agent.agentId, "pending", 0)
      .run();

    try {
      const signature = await signPayload(eventBody, agent.secret);

      const response = await fetch(agent.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-ID": correlationId,
          "X-Event-ID": eventId,
          "X-Signature": signature,
        },
        body: eventBody,
      });

      if (response.ok) {
        await env.DB.prepare(
          "UPDATE event_deliveries SET status = 'delivered', attempts = 1, last_attempt_at = datetime('now') WHERE id = ?",
        )
          .bind(deliveryId)
          .run();
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        const errorMsg = `HTTP ${response.status}: ${errorText.slice(0, 500)}`;
        await env.DB.prepare(
          "UPDATE event_deliveries SET status = 'failed', attempts = 1, last_attempt_at = datetime('now'), last_error = ? WHERE id = ?",
        )
          .bind(errorMsg, deliveryId)
          .run();

        // Check if max attempts reached — move to dead letter queue
        const delivery = await env.DB.prepare(
          "SELECT attempts, max_attempts, created_at FROM event_deliveries WHERE id = ?",
        )
          .bind(deliveryId)
          .first();
        if (
          delivery &&
          (delivery.attempts as number) >= (delivery.max_attempts as number)
        ) {
          await moveToDeadLetter(env.DB, {
            eventId,
            agentId: agent.agentId,
            deliveryId,
            tenantId,
            eventType: type,
            eventSource: source,
            eventPayload: eventBody,
            errorMessage: errorMsg,
            totalAttempts: delivery.attempts as number,
            firstAttemptAt: delivery.created_at as string,
            lastAttemptAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      await env.DB.prepare(
        "UPDATE event_deliveries SET status = 'failed', attempts = 1, last_attempt_at = datetime('now'), last_error = ? WHERE id = ?",
      )
        .bind(errorMessage, deliveryId)
        .run();

      // Check if max attempts reached — move to dead letter queue
      const delivery = await env.DB.prepare(
        "SELECT attempts, max_attempts, created_at FROM event_deliveries WHERE id = ?",
      )
        .bind(deliveryId)
        .first();
      if (
        delivery &&
        (delivery.attempts as number) >= (delivery.max_attempts as number)
      ) {
        await moveToDeadLetter(env.DB, {
          eventId,
          agentId: agent.agentId,
          deliveryId,
          tenantId,
          eventType: type,
          eventSource: source,
          eventPayload: eventBody,
          errorMessage,
          totalAttempts: delivery.attempts as number,
          firstAttemptAt: delivery.created_at as string,
          lastAttemptAt: new Date().toISOString(),
        });
      }
    }
  });

  await Promise.allSettled(deliveryPromises);

  // Check if all deliveries completed
  const allDeliveries = await env.DB.prepare(
    "SELECT status FROM event_deliveries WHERE event_id = ?",
  )
    .bind(eventId)
    .all();

  const allDone = allDeliveries.results.every(
    (d: Record<string, unknown>) => d.status === "delivered",
  );
  const finalStatus = allDone ? "completed" : "failed";

  await env.DB.prepare(
    "UPDATE events SET status = ?, processed_at = datetime('now') WHERE id = ?",
  )
    .bind(finalStatus, eventId)
    .run();
}
