import type { Context } from "hono";
import type { Bindings, Variables, ConfluenceWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// Confluence webhook events we handle
const HANDLED_EVENTS = new Set([
  "user.created",
  "user.updated",
  "user.deleted",
  "group_user_added",
  "group_user_removed",
]);

function isHandledEvent(event: string): boolean {
  return HANDLED_EVENTS.has(event);
}

/**
 * Verify Confluence webhook signature using HMAC-SHA256.
 * Confluence sends the signature in X-Atlassian-Webhook-Signature as "sha256=<hex>".
 */
async function verifySignature(
  secret: string,
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;

  const receivedSig = signatureHeader.slice(prefix.length);

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

  if (receivedSig.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < receivedSig.length; i++) {
    mismatch |= receivedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

function mapEventToAtlasType(event: string): string | null {
  switch (event) {
    case "user.created":
      return "user.provisioned";
    case "user.deleted":
      return "user.deprovisioned";
    case "group_user_added":
      return "group.member_added";
    case "group_user_removed":
      return "group.member_removed";
    default:
      return null;
  }
}

function buildPayload(
  event: string,
  body: ConfluenceWebhookPayload,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    confluenceEvent: event,
    timestamp: body.timestamp,
  };

  if (body.user) {
    base.user = {
      accountId: body.user.accountId,
      email: body.user.email,
      publicName: body.user.publicName,
    };
  }

  if (body.group) {
    base.group = {
      name: body.group.name,
      type: body.group.type,
    };
  }

  return base;
}

export async function handleConfluenceWebhook(
  c: HonoContext,
): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Atlassian-Webhook-Signature");
  const eventHeader = c.req.header("X-Atlassian-Webhook-Event");
  const deliveryId = c.req.header("X-Delivery-ID");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Atlassian-Webhook-Signature header", correlationId },
      401,
    );
  }

  if (!eventHeader) {
    return c.json(
      { error: "Missing X-Atlassian-Webhook-Event header", correlationId },
      400,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.CONFLUENCE_WEBHOOK_SECRET,
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

  const body = JSON.parse(rawBody) as ConfluenceWebhookPayload;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      deliveryId,
      message: "Confluence webhook received",
      event: eventHeader,
    }),
  );

  if (!isHandledEvent(eventHeader)) {
    return c.json({
      status: "ignored",
      event: eventHeader,
      correlationId,
    });
  }

  const atlasEventType = mapEventToAtlasType(eventHeader);
  if (!atlasEventType) {
    return c.json({ status: "ignored", correlationId });
  }

  // Resolve tenantId from user or group data
  const tenantId = await resolveCloudIdTenantId(
    c.env.DB,
    body.user?.accountId || body.group?.name || "unknown",
  );

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        deliveryId,
        message: "No tenant mapping found",
      }),
    );
    return c.json({
      status: "ignored",
      reason: "unmapped_tenant",
      correlationId,
    });
  }

  const eventPayload = buildPayload(eventHeader, body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:confluence",
      payload: eventPayload,
      idempotencyKey: deliveryId ?? undefined,
      correlationId,
    });

    return c.json({
      status: "processed",
      event: eventHeader,
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
        message: "Failed to publish Confluence webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a Confluence cloudId to an AtlasIT tenant_id.
 */
async function resolveCloudIdTenantId(
  db: D1Database,
  identifier: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'confluence'
       LIMIT 1`,
    )
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
