import type { Context } from "hono";
import type { Bindings, Variables, AsanaWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// Asana webhook events we handle
const HANDLED_EVENTS = new Set([
  "user.added",
  "user.removed",
  "team_member_added",
  "team_member_removed",
]);

function isHandledEvent(event: string): boolean {
  return HANDLED_EVENTS.has(event);
}

/**
 * Verify Asana webhook signature using HMAC-SHA256.
 * Asana sends the signature in X-Hook-Signature as "sha256=<hex>".
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
    case "user.added":
      return "user.provisioned";
    case "user.removed":
      return "user.deprovisioned";
    case "team_member_added":
      return "group.member_added";
    case "team_member_removed":
      return "group.member_removed";
    default:
      return null;
  }
}

function buildPayload(
  event: string,
  eventData: AsanaWebhookPayload["events"][0],
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    asanaEvent: event,
    resourceGid: eventData.resource.gid,
    timestamp: eventData.timestamp,
  };

  if (eventData.user) {
    base.user = {
      gid: eventData.user.gid,
      name: eventData.user.name,
      email: eventData.user.email,
    };
  }

  if (eventData.resource.name) {
    base.resourceName = eventData.resource.name;
  }

  return base;
}

export async function handleAsanaWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Hook-Signature");
  const deliveryId = c.req.header("X-Delivery-ID") ?? "unknown";

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Hook-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.ASANA_WEBHOOK_SECRET,
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

  let body: AsanaWebhookPayload;
  try {
    body = JSON.parse(rawBody) as AsanaWebhookPayload;
  } catch {
    return c.json({ error: "Invalid JSON payload", correlationId }, 400);
  }

  if (!body.events || body.events.length === 0) {
    return c.json({ status: "ignored", reason: "no_events", correlationId });
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      deliveryId,
      message: "Asana webhook received",
      eventCount: body.events.length,
    }),
  );

  const results = [];

  for (const event of body.events) {
    if (!isHandledEvent(event.type)) {
      results.push({ event: event.type, status: "ignored" });
      continue;
    }

    const atlasEventType = mapEventToAtlasType(event.type);
    if (!atlasEventType) {
      results.push({ event: event.type, status: "ignored" });
      continue;
    }

    // Resolve tenantId from workspace/team data
    const tenantId = await resolveWorkspaceGidTenantId(
      c.env.DB,
      event.resource.gid,
    );

    if (!tenantId) {
      console.log(
        JSON.stringify({
          level: "warn",
          correlationId,
          deliveryId,
          message: "No tenant mapping found",
          resourceGid: event.resource.gid,
        }),
      );
      results.push({
        event: event.type,
        status: "ignored",
        reason: "unmapped",
      });
      continue;
    }

    const eventPayload = buildPayload(event.type, event);

    try {
      await publishEvent({
        orchestratorUrl: c.env.ORCHESTRATOR_URL,
        tenantId,
        type: atlasEventType,
        source: "connector:asana",
        payload: eventPayload,
        idempotencyKey: `${deliveryId}-${event.resource.gid}`,
        correlationId,
      });

      results.push({ event: event.type, status: "processed" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          deliveryId,
          message: "Failed to publish Asana webhook event",
          error: msg,
          event: event.type,
        }),
      );
      results.push({ event: event.type, status: "error", error: msg });
    }
  }

  return c.json({
    status: "processed",
    eventCount: body.events.length,
    results,
    correlationId,
  });
}

/**
 * Resolve an Asana workspace GID to an AtlasIT tenant_id.
 */
async function resolveWorkspaceGidTenantId(
  db: D1Database,
  workspaceGid: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'asana' AND json_extract(config, '$.workspaceGid') = ?
       LIMIT 1`,
    )
    .bind(workspaceGid)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
