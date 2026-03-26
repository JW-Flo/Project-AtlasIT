import type { Context } from "hono";
import type { Bindings, Variables, PagerDutyWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

const HANDLED_EVENTS = new Set([
  "user.created",
  "user.updated",
  "user.deleted",
]);

function isHandledEvent(event: string): boolean {
  return HANDLED_EVENTS.has(event);
}

/**
 * Verify PagerDuty webhook signature using HMAC-SHA256.
 * PagerDuty sends the signature in X-PagerDuty-Signature (V3 format).
 */
async function verifySignature(
  secret: string,
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
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

  // Constant-time comparison
  if (signatureHeader.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < signatureHeader.length; i++) {
    mismatch |= signatureHeader.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

function mapEventToAtlasType(pdEvent: string): string | null {
  switch (pdEvent) {
    case "user.created":
      return "user.provisioned";
    case "user.deleted":
      return "user.deprovisioned";
    case "user.updated":
      return "user.updated";
    default:
      return null;
  }
}

function buildPayload(
  pdEvent: string,
  body: PagerDutyWebhookPayload,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    pdEvent,
  };

  if (body.messages && body.messages.length > 0) {
    const message = body.messages[0];
    if (message.data) {
      base.eventId = message.data.id;
      base.eventType = message.data.type;
      base.summary = message.data.summary;

      if (message.data.user) {
        base.user = {
          id: message.data.user.id,
          name: message.data.user.name,
          email: message.data.user.email,
        };
      }

      if (message.data.team) {
        base.team = {
          id: message.data.team.id,
          name: message.data.team.name,
        };
      }
    }
  }

  return base;
}

export async function handlePagerDutyWebhook(
  c: HonoContext,
): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-PagerDuty-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-PagerDuty-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.PAGERDUTY_WEBHOOK_SECRET,
    rawBody,
    signatureHeader,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody) as PagerDutyWebhookPayload;

  if (!body.messages || body.messages.length === 0) {
    return c.json({ status: "ignored", reason: "no_messages", correlationId });
  }

  const message = body.messages[0];
  const pdEvent = message.data?.type;

  if (!pdEvent) {
    return c.json({
      status: "ignored",
      reason: "no_event_type",
      correlationId,
    });
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "PagerDuty webhook received",
      event: pdEvent,
    }),
  );

  if (!isHandledEvent(pdEvent)) {
    return c.json({
      status: "ignored",
      event: pdEvent,
      correlationId,
    });
  }

  const atlasEventType = mapEventToAtlasType(pdEvent);
  if (!atlasEventType) {
    return c.json({ status: "ignored", correlationId });
  }

  // Resolve tenantId from the message data
  // In production, look up PagerDuty account -> tenant mapping from D1
  const tenantId = await resolveTenantId(c.env.DB);

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        message: "No tenant mapping for PagerDuty",
      }),
    );
    return c.json({
      status: "ignored",
      reason: "unmapped_account",
      correlationId,
    });
  }

  const eventPayload = buildPayload(pdEvent, body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:pagerduty",
      payload: eventPayload,
      correlationId,
    });

    return c.json({
      status: "processed",
      event: pdEvent,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Failed to publish PagerDuty webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a PagerDuty account to an AtlasIT tenant_id.
 * Uses the connector_configs table where connector_slug='pagerduty'.
 */
async function resolveTenantId(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'pagerduty'
       LIMIT 1`,
    )
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
