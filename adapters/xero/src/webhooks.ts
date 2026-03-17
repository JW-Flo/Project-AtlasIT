import type { Context } from "hono";
import type { Bindings, Variables, XeroWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Xero webhook signature using HMAC-SHA256.
 * Xero sends the signature in x-xero-signature header.
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
  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));

  // Constant-time comparison
  if (signatureHeader.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < signatureHeader.length; i++) {
    mismatch |= signatureHeader.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

function mapEventToAtlasType(
  eventCategory: string,
  eventType: string,
): string | null {
  const key = `${eventCategory}.${eventType}`;

  switch (key) {
    case "CONTACT.CREATE":
      return "group.created";
    case "CONTACT.UPDATE":
      return "group.updated";
    case "CONTACT.DELETE":
      return "group.deleted";
    default:
      return null;
  }
}

function buildPayload(
  eventCategory: string,
  eventType: string,
  resourceId: string,
): Record<string, unknown> {
  return {
    resourceType: eventCategory,
    eventType,
    resourceId,
  };
}

export async function handleXeroWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("x-xero-signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing x-xero-signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.XERO_WEBHOOK_SECRET,
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

  const body = JSON.parse(rawBody) as XeroWebhookPayload;

  if (!body.webhookEvents || body.webhookEvents.length === 0) {
    return c.json({ status: "ignored", reason: "no_events", correlationId });
  }

  const xeroTenantId = body.webhookEvents[0]?.tenantId;
  if (!xeroTenantId) {
    return c.json({
      status: "ignored",
      reason: "no_tenant_id",
      correlationId,
    });
  }

  // Resolve AtlasIT tenantId from Xero tenantId
  const atlastenantId = await resolveTenantId(c.env.DB, xeroTenantId);

  if (!atlastenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        message: "No tenant mapping found for Xero",
        xeroTenantId,
      }),
    );
    return c.json({
      status: "ignored",
      reason: "unmapped_tenant",
      correlationId,
    });
  }

  // Process all events in the notification
  const eventIds: string[] = [];

  for (const webhookEvent of body.webhookEvents) {
    const atlasEventType = mapEventToAtlasType(
      webhookEvent.eventCategory,
      webhookEvent.eventType,
    );

    if (!atlasEventType) {
      console.log(
        JSON.stringify({
          level: "debug",
          correlationId,
          message: "Ignoring unhandled Xero event type",
          eventCategory: webhookEvent.eventCategory,
          eventType: webhookEvent.eventType,
        }),
      );
      continue;
    }

    const eventPayload = buildPayload(
      webhookEvent.eventCategory,
      webhookEvent.eventType,
      webhookEvent.resourceId,
    );

    try {
      const result = await publishEvent({
        orchestratorUrl: c.env.ORCHESTRATOR_URL,
        tenantId: atlastenantId,
        type: atlasEventType,
        source: "connector:xero",
        payload: eventPayload,
        idempotencyKey: `${xeroTenantId}-${webhookEvent.resourceId}-${webhookEvent.eventType}`,
        correlationId,
      });

      eventIds.push(result.id);

      console.log(
        JSON.stringify({
          level: "info",
          correlationId,
          message: "Published Xero webhook event",
          eventId: result.id,
          eventCategory: webhookEvent.eventCategory,
          eventType: webhookEvent.eventType,
        }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          message: "Failed to publish Xero webhook event",
          eventCategory: webhookEvent.eventCategory,
          error: msg,
        }),
      );
    }
  }

  return c.json({
    status: "processed",
    xeroTenantId,
    eventIds,
    correlationId,
  });
}

/**
 * Resolve a Xero tenantId to an AtlasIT tenant_id.
 * Uses connector_configs where connector_slug='xero' and
 * the config JSON contains the tenantId.
 */
async function resolveTenantId(
  db: D1Database,
  xeroTenantId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'xero' AND json_extract(config, '$.tenantId') = ?
       LIMIT 1`,
    )
    .bind(xeroTenantId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
