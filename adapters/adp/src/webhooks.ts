import type { Context } from "hono";
import type {
  Bindings,
  Variables,
  ADPWebhookPayload,
  ADPNotificationEvent,
} from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// ADP event name codes we handle
const HANDLED_EVENT_CODES = new Set([
  "worker.hire",
  "worker.terminate",
  "worker.rehire",
  "worker.personal-communication.change",
  "worker.business-communication.change",
  "worker.work-assignment.change",
  "worker.legal-name.change",
  "worker.status.change",
]);

function isHandledEvent(event: ADPNotificationEvent): boolean {
  const code = event.eventNameCode?.codeValue?.toLowerCase() ?? "";
  return HANDLED_EVENT_CODES.has(code);
}

/**
 * Map ADP event name codes to AtlasIT event types.
 */
function mapEventToAtlasType(eventCode: string): string | null {
  const code = eventCode.toLowerCase();
  switch (code) {
    case "worker.hire":
      return "user.provisioned";
    case "worker.terminate":
      return "user.deprovisioned";
    case "worker.rehire":
      return "user.provisioned";
    case "worker.personal-communication.change":
    case "worker.business-communication.change":
    case "worker.legal-name.change":
      return "user.updated";
    case "worker.work-assignment.change":
      return "user.role_changed";
    case "worker.status.change":
      return "user.status_changed";
    default:
      return null;
  }
}

function buildPayload(
  event: ADPNotificationEvent,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    adpEventID: event.eventID,
    adpEventCode: event.eventNameCode?.codeValue,
    adpEventStatus: event.eventStatusCode?.codeValue,
    effectiveDateTime: event.effectiveDateTime,
    creationDateTime: event.creationDateTime,
  };

  if (event.data?.eventContext?.worker) {
    base.worker = {
      associateOID: event.data.eventContext.worker.associateOID,
    };
  }

  if (event.data?.output) {
    base.output = event.data.output;
  }

  return base;
}

/**
 * Verify ADP webhook signature using HMAC-SHA256.
 * ADP sends the signature in the X-ADP-Signature header as a hex digest.
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

export async function handleADPWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-ADP-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-ADP-Signature header", correlationId },
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
        message: "Invalid ADP webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody) as ADPWebhookPayload;

  if (!body.events?.length) {
    return c.json({ status: "ignored", reason: "no_events", correlationId });
  }

  const results: Array<{
    eventID: string;
    status: string;
    atlasEventType?: string;
  }> = [];

  for (const event of body.events) {
    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        message: "ADP webhook event received",
        eventID: event.eventID,
        eventCode: event.eventNameCode?.codeValue,
      }),
    );

    if (!isHandledEvent(event)) {
      results.push({
        eventID: event.eventID,
        status: "ignored",
      });
      continue;
    }

    const eventCode = event.eventNameCode?.codeValue ?? "";
    const atlasEventType = mapEventToAtlasType(eventCode);

    if (!atlasEventType) {
      results.push({ eventID: event.eventID, status: "ignored" });
      continue;
    }

    // Resolve tenantId from the worker's associateOID via connector_configs
    const associateOID = event.data?.eventContext?.worker?.associateOID;
    const tenantId = await resolveTenantId(c.env.DB, associateOID);

    if (!tenantId) {
      console.log(
        JSON.stringify({
          level: "warn",
          correlationId,
          message: "No tenant mapping for ADP event",
          eventID: event.eventID,
          associateOID,
        }),
      );
      results.push({
        eventID: event.eventID,
        status: "ignored",
        atlasEventType,
      });
      continue;
    }

    const eventPayload = buildPayload(event);

    try {
      await publishEvent({
        orchestratorUrl: c.env.ORCHESTRATOR_URL,
        tenantId,
        type: atlasEventType,
        source: "connector:adp",
        payload: eventPayload,
        idempotencyKey: event.eventID,
        correlationId,
      });

      results.push({
        eventID: event.eventID,
        status: "processed",
        atlasEventType,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          message: "Failed to publish ADP webhook event",
          eventID: event.eventID,
          error: msg,
        }),
      );
      results.push({ eventID: event.eventID, status: "error" });
    }
  }

  return c.json({ status: "processed", correlationId, events: results });
}

/**
 * Resolve an ADP worker event to an AtlasIT tenant_id.
 * Looks up tenants that have an ADP connector configured.
 * If associateOID is provided, tries to match via directory_users first.
 */
async function resolveTenantId(
  db: D1Database,
  associateOID?: string,
): Promise<string | null> {
  // Try to resolve via the worker's existing directory entry
  if (associateOID) {
    const userRow = await db
      .prepare(
        `SELECT tenant_id FROM directory_users
         WHERE external_id = ?
         LIMIT 1`,
      )
      .bind(associateOID)
      .first<{ tenant_id: string }>();

    if (userRow) return userRow.tenant_id;
  }

  // Fallback: return the first tenant with an ADP connector configured.
  // In a multi-tenant setup, ADP webhook subscriptions are per-tenant,
  // so the webhook URL typically encodes the tenant context.
  const configRow = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'adp'
       LIMIT 1`,
    )
    .first<{ tenant_id: string }>();

  return configRow?.tenant_id ?? null;
}
