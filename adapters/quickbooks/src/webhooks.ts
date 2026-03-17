import type { Context } from "hono";
import type { Bindings, Variables, QuickBooksWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify QuickBooks webhook signature using HMAC-SHA256.
 * QuickBooks sends the signature in intuit-signature header.
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
  entityName: string,
  operation: string,
): string | null {
  const key = `${entityName}.${operation}`;

  switch (key) {
    case "Employee.Create":
      return "user.provisioned";
    case "Employee.Update":
      return "user.updated";
    case "Employee.Delete":
      return "user.deprovisioned";
    case "Customer.Create":
      return "group.created";
    case "Customer.Update":
      return "group.updated";
    case "Customer.Delete":
      return "group.deleted";
    default:
      return null;
  }
}

function buildPayload(
  entityName: string,
  operation: string,
  entityId: string,
): Record<string, unknown> {
  return {
    entityType: entityName,
    operation,
    entityId,
  };
}

export async function handleQuickBooksWebhook(
  c: HonoContext,
): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("intuit-signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing intuit-signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.QUICKBOOKS_WEBHOOK_SECRET,
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

  const body = JSON.parse(rawBody) as QuickBooksWebhookPayload;

  if (!body.eventNotifications || body.eventNotifications.length === 0) {
    return c.json({ status: "ignored", reason: "no_events", correlationId });
  }

  const realmId = body.eventNotifications[0]?.realmId;
  if (!realmId) {
    return c.json({
      status: "ignored",
      reason: "no_realm_id",
      correlationId,
    });
  }

  // Resolve tenantId from realmId
  const tenantId = await resolveTenantId(c.env.DB, realmId);

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        message: "No tenant mapping found for QuickBooks realm",
        realmId,
      }),
    );
    return c.json({
      status: "ignored",
      reason: "unmapped_realm",
      correlationId,
    });
  }

  // Process all events in the notification
  const eventIds: string[] = [];

  for (const notification of body.eventNotifications) {
    for (const entity of notification.dataChangeEvent?.entities ?? []) {
      const atlasEventType = mapEventToAtlasType(entity.name, entity.operation);

      if (!atlasEventType) {
        console.log(
          JSON.stringify({
            level: "debug",
            correlationId,
            message: "Ignoring unhandled QuickBooks event type",
            entityType: entity.name,
            operation: entity.operation,
          }),
        );
        continue;
      }

      const eventPayload = buildPayload(
        entity.name,
        entity.operation,
        entity.id,
      );

      try {
        const result = await publishEvent({
          orchestratorUrl: c.env.ORCHESTRATOR_URL,
          tenantId,
          type: atlasEventType,
          source: "connector:quickbooks",
          payload: eventPayload,
          idempotencyKey: `${realmId}-${entity.id}-${entity.operation}`,
          correlationId,
        });

        eventIds.push(result.id);

        console.log(
          JSON.stringify({
            level: "info",
            correlationId,
            message: "Published QuickBooks webhook event",
            eventId: result.id,
            entityType: entity.name,
            operation: entity.operation,
          }),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(
          JSON.stringify({
            level: "error",
            correlationId,
            message: "Failed to publish QuickBooks webhook event",
            entityType: entity.name,
            error: msg,
          }),
        );
      }
    }
  }

  return c.json({
    status: "processed",
    realmId,
    eventIds,
    correlationId,
  });
}

/**
 * Resolve a QuickBooks realmId to a tenant_id.
 * Uses connector_configs where connector_slug='quickbooks' and
 * the config JSON contains the realmId.
 */
async function resolveTenantId(
  db: D1Database,
  realmId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'quickbooks' AND json_extract(config, '$.realmId') = ?
       LIMIT 1`,
    )
    .bind(realmId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
