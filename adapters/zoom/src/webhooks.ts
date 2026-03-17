import type { Context } from "hono";
import type { Bindings, Variables, ZoomWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Zoom webhook signature using HMAC-SHA256 v3.
 * Zoom sends: x-zm-signature header with v3 format.
 */
async function verifyZoomSignature(
  secret: string,
  requestTimestamp: string,
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();

    // Message is timestamp + request body
    const message = encoder.encode(requestTimestamp + rawBody);

    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Compute HMAC
    const sigBuffer = await crypto.subtle.sign("HMAC", key, message);
    const computedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));

    // Zoom signature format: v0=<base64>
    const expectedPrefix = "v0=";
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
  } catch (err) {
    console.error("Zoom signature verification error:", err);
    return false;
  }
}

function mapEventToAtlasType(event: string): string | null {
  switch (event) {
    case "user.created":
      return "user.provisioned";
    case "user.deleted":
      return "user.deprovisioned";
    case "user.updated":
      return "user.updated";
    case "group.created":
      return "group.created";
    case "group.deleted":
      return "group.deleted";
    case "group_member.added":
      return "group.member_added";
    case "group_member.removed":
      return "group.member_removed";
    default:
      return null;
  }
}

function buildPayload(payload: ZoomWebhookPayload): Record<string, unknown> {
  return {
    event: payload.event,
    accountId: payload.payload.account_id,
    object: payload.payload.object,
  };
}

export async function handleZoomWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signature = c.req.header("x-zm-signature");
  const timestamp = c.req.header("x-zm-request-timestamp");

  if (!signature || !timestamp) {
    return c.json(
      {
        error: "Missing x-zm-signature or x-zm-request-timestamp header",
        correlationId,
      },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifyZoomSignature(
    c.env.ZOOM_WEBHOOK_SECRET,
    timestamp,
    rawBody,
    signature,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid Zoom webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  // Check timestamp freshness (within 5 minutes)
  const requestTime = parseInt(timestamp, 10) * 1000;
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  if (Math.abs(now - requestTime) > maxAge) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Zoom webhook timestamp too old",
      }),
    );
    return c.json({ error: "Request timestamp too old", correlationId }, 401);
  }

  const body = JSON.parse(rawBody) as ZoomWebhookPayload;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Zoom webhook received",
      event: body.event,
      accountId: body.payload.account_id,
    }),
  );

  const atlasEventType = mapEventToAtlasType(body.event);
  if (!atlasEventType) {
    return c.json({
      status: "ignored",
      event: body.event,
      correlationId,
    });
  }

  // Resolve tenantId from Zoom account
  const tenantId = await resolveAccountTenantId(
    c.env.DB,
    body.payload.account_id,
  );

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        message: "No tenant mapping for Zoom account",
        accountId: body.payload.account_id,
      }),
    );
    return c.json({
      status: "ignored",
      reason: "unmapped_account",
      correlationId,
    });
  }

  const eventPayload = buildPayload(body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:zoom",
      payload: eventPayload,
      idempotencyKey: body.event + ":" + body.payload.object.id,
      correlationId,
    });

    return c.json({
      status: "processed",
      event: body.event,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Failed to publish Zoom webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a Zoom account to an AtlasIT tenant_id.
 */
async function resolveAccountTenantId(
  db: D1Database,
  accountId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'zoom' AND json_extract(config, '$.accountId') = ?
       LIMIT 1`,
    )
    .bind(accountId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
