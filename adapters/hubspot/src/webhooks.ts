import type { Context } from "hono";
import type { Bindings, Variables, HubSpotWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify HubSpot webhook signature using HMAC-SHA256 v3.
 * HubSpot sends: X-HubSpot-Signature-v3 header with format "sha256=<hex>"
 */
async function verifyHubSpotSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const encoder = new TextEncoder();

  // HubSpot signature = HMAC-SHA256(request_body, webhook_secret)
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
  const computedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // HubSpot signature format: sha256=<hex>
  const expectedPrefix = "sha256=";
  const receivedSig = signatureHeader.startsWith(expectedPrefix)
    ? signatureHeader.slice(expectedPrefix.length)
    : signatureHeader;

  // Constant-time comparison
  if (computedSig.length !== receivedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < computedSig.length; i++) {
    mismatch |= computedSig.charCodeAt(i) ^ receivedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

function mapEventToAtlasType(subscriptionType: string): string | null {
  switch (subscriptionType) {
    case "contact.creation":
      return "user.provisioned";
    case "contact.deletion":
      return "user.deprovisioned";
    case "contact.propertyChange":
      return "user.updated";
    default:
      return null;
  }
}

function buildPayload(body: HubSpotWebhookPayload): Record<string, unknown> {
  return {
    eventId: body.eventId,
    portalId: body.portalId,
    occurredAt: body.occurredAt,
    subscriptionType: body.subscriptionType,
    objectId: body.objectId,
    changedProperties: body.changedProperties,
  };
}

export async function handleHubSpotWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-HubSpot-Signature-v3");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-HubSpot-Signature-v3 header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifyHubSpotSignature(
    c.env.HUBSPOT_WEBHOOK_SECRET,
    rawBody,
    signatureHeader,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid HubSpot webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody) as HubSpotWebhookPayload;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "HubSpot webhook received",
      subscriptionType: body.subscriptionType,
      portalId: body.portalId,
      objectId: body.objectId,
    }),
  );

  const atlasEventType = mapEventToAtlasType(body.subscriptionType);
  if (!atlasEventType) {
    return c.json({
      status: "ignored",
      subscriptionType: body.subscriptionType,
      correlationId,
    });
  }

  // Resolve tenantId from HubSpot portal
  const tenantId = await resolvePortalTenantId(c.env.DB, body.portalId);

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        message: "No tenant mapping for HubSpot portal",
        portalId: body.portalId,
      }),
    );
    return c.json({
      status: "ignored",
      reason: "unmapped_portal",
      correlationId,
    });
  }

  const eventPayload = buildPayload(body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:hubspot",
      payload: eventPayload,
      idempotencyKey: String(body.eventId),
      correlationId,
    });

    return c.json({
      status: "processed",
      subscriptionType: body.subscriptionType,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Failed to publish HubSpot webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a HubSpot portal ID to an AtlasIT tenant_id.
 */
async function resolvePortalTenantId(
  db: D1Database,
  portalId: number,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'hubspot' AND json_extract(config, '$.portalId') = ?
       LIMIT 1`,
    )
    .bind(String(portalId))
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
