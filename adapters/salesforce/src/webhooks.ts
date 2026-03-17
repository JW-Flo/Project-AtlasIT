import type { Context } from "hono";
import type { Bindings, Variables, SalesforceWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Salesforce webhook signature using HMAC-SHA256.
 * Salesforce sends: X-Salesforce-Content-MAC header
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

function mapEventToAtlasType(actionType: string): string | null {
  switch (actionType) {
    case "created":
    case "updated":
      return "user.provisioned";
    case "deleted":
      return "user.deprovisioned";
    default:
      return null;
  }
}

function buildPayload(body: SalesforceWebhookPayload): Record<string, unknown> {
  return {
    salesforceActionType: body.actionType,
    changeType: body.changeType,
    changedFields: body.changedFields,
    timestamp: body.timestamp,
    entity: body.entity,
  };
}

export async function handleSalesforceWebhook(
  c: HonoContext,
): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Salesforce-Content-MAC");

  if (!signatureHeader) {
    return c.json(
      {
        error: "Missing X-Salesforce-Content-MAC header",
        correlationId,
      },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.SALESFORCE_WEBHOOK_SECRET,
    rawBody,
    signatureHeader,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid Salesforce webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  try {
    const body = JSON.parse(rawBody) as SalesforceWebhookPayload;

    const atlasEventType = mapEventToAtlasType(body.actionType);
    if (!atlasEventType) {
      return c.json({
        status: "ignored",
        action: body.actionType,
        correlationId,
      });
    }

    // Resolve tenantId — in production, map from Salesforce org to AtlasIT tenant
    const tenantId = await resolveSalesforceOrgTenantId(
      c.env.DB,
      body.entity?.orgId as string,
    );

    if (!tenantId) {
      console.log(
        JSON.stringify({
          level: "warn",
          correlationId,
          message: "No tenant mapping for Salesforce org",
          orgId: body.entity?.orgId,
        }),
      );
      return c.json({
        status: "ignored",
        reason: "unmapped_org",
        correlationId,
      });
    }

    const eventPayload = buildPayload(body);

    try {
      await publishEvent({
        orchestratorUrl: c.env.ORCHESTRATOR_URL,
        tenantId,
        type: atlasEventType,
        source: "connector:salesforce",
        payload: eventPayload,
        idempotencyKey: body.entity?.Id as string | undefined,
        correlationId,
      });

      console.log(
        JSON.stringify({
          level: "info",
          correlationId,
          message: "Salesforce webhook event published",
          actionType: body.actionType,
          atlasEventType,
        }),
      );

      return c.json({
        status: "processed",
        action: body.actionType,
        atlasEventType,
        correlationId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          message: "Failed to publish Salesforce webhook event",
          error: msg,
        }),
      );
      return c.json({ error: msg, correlationId }, 500);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Salesforce webhook processing failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a Salesforce org ID to an AtlasIT tenant_id.
 * Uses the connector_configs table where connector_slug='salesforce'.
 */
async function resolveSalesforceOrgTenantId(
  db: D1Database,
  orgId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'salesforce' AND json_extract(config, '$.orgId') = ?
       LIMIT 1`,
    )
    .bind(orgId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
