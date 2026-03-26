import type { Context } from "hono";
import type {
  Bindings,
  Variables,
  CrowdStrikeWebhookPayload,
} from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// CrowdStrike detection/event types we handle
const HANDLED_EVENTS = new Set([
  "DetectionSummaryEvent",
  "AuthActivityAuditEvent",
  "UserActivityAuditEvent",
  "RemoteResponseSessionStartEvent",
  "RemoteResponseSessionEndEvent",
  "IncidentSummaryEvent",
]);

function isHandledEvent(eventType: string): boolean {
  return HANDLED_EVENTS.has(eventType);
}

/**
 * Verify CrowdStrike webhook signature using HMAC-SHA256.
 * CrowdStrike sends the signature in X-CS-Signature as a hex-encoded HMAC.
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

function mapEventToAtlasType(eventType: string): string | null {
  switch (eventType) {
    case "DetectionSummaryEvent":
      return "security.detection";
    case "IncidentSummaryEvent":
      return "security.incident";
    case "AuthActivityAuditEvent":
      return "audit.auth_activity";
    case "UserActivityAuditEvent":
      return "audit.user_activity";
    case "RemoteResponseSessionStartEvent":
      return "session.remote_response_started";
    case "RemoteResponseSessionEndEvent":
      return "session.remote_response_ended";
    default:
      return null;
  }
}

function buildPayload(
  body: CrowdStrikeWebhookPayload,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    crowdstrikeEvent: body.event_type,
    timestamp: body.timestamp,
  };

  if (body.detection_id) {
    base.detectionId = body.detection_id;
  }

  if (body.device_id) {
    base.device = {
      deviceId: body.device_id,
      hostname: body.hostname ?? null,
    };
  }

  if (body.severity !== undefined) {
    base.severity = body.severity;
  }

  if (body.metadata) {
    base.metadata = body.metadata;
  }

  return base;
}

export async function handleCrowdStrikeWebhook(
  c: HonoContext,
): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-CS-Signature");
  const deliveryId = c.req.header("X-CS-Delivery-ID") ?? crypto.randomUUID();

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-CS-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.ADAPTER_SECRET,
    rawBody,
    signatureHeader,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        deliveryId,
        message: "Invalid webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody) as CrowdStrikeWebhookPayload;
  const eventType = body.event_type;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      deliveryId,
      message: "CrowdStrike webhook received",
      eventType,
      deviceId: body.device_id ?? null,
      severity: body.severity ?? null,
    }),
  );

  if (!isHandledEvent(eventType)) {
    return c.json({
      status: "ignored",
      eventType,
      correlationId,
    });
  }

  const atlasEventType = mapEventToAtlasType(eventType);
  if (!atlasEventType) {
    return c.json({ status: "ignored", correlationId });
  }

  // Resolve tenantId from the CrowdStrike customer ID (CID).
  // In production, look up CID -> tenant mapping from D1.
  const tenantId = await resolveCidTenantId(
    c.env.DB,
    body.metadata?.cid as string | undefined,
  );

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        deliveryId,
        message: "No tenant mapping for CrowdStrike CID",
        cid: body.metadata?.cid ?? "unknown",
      }),
    );
    return c.json({ status: "ignored", reason: "unmapped_cid", correlationId });
  }

  const eventPayload = buildPayload(body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:crowdstrike",
      payload: eventPayload,
      idempotencyKey: deliveryId,
      correlationId,
    });

    return c.json({
      status: "processed",
      eventType,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        deliveryId,
        message: "Failed to publish CrowdStrike webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a CrowdStrike CID to an AtlasIT tenant_id.
 * Uses the connector_configs table where connector_slug='crowdstrike' and
 * the config JSON contains the CID.
 */
async function resolveCidTenantId(
  db: D1Database,
  cid?: string,
): Promise<string | null> {
  if (!cid) return null;

  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'crowdstrike' AND json_extract(config, '$.cid') = ?
       LIMIT 1`,
    )
    .bind(cid)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
