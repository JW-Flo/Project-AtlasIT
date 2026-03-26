import type { Context } from "hono";
import type { Bindings, Variables, DocuSignWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify DocuSign webhook signature using HMAC-SHA256.
 * DocuSign sends: X-DocuSign-Signature-1 header
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
    case "USER_CREATED":
    case "USER_UPDATED":
      return "user.provisioned";
    case "USER_DELETED":
      return "user.deprovisioned";
    case "GROUP_CREATED":
      return "group.created";
    case "GROUP_DELETED":
      return "group.deleted";
    case "GROUP_MEMBER_ADDED":
      return "group.member_added";
    case "GROUP_MEMBER_REMOVED":
      return "group.member_removed";
    default:
      return null;
  }
}

function buildPayload(body: DocuSignWebhookPayload): Record<string, unknown> {
  return {
    apiVersion: body.apiVersion,
    eventType: body.eventType,
    createdDateTime: body.createdDateTime,
    data: body.data,
  };
}

export async function handleDocuSignWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-DocuSign-Signature-1");

  if (!signatureHeader) {
    return c.json(
      {
        error: "Missing X-DocuSign-Signature-1 header",
        correlationId,
      },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.DOCUSIGN_WEBHOOK_SECRET,
    rawBody,
    signatureHeader,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid DocuSign webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  try {
    const body = JSON.parse(rawBody) as DocuSignWebhookPayload;

    const atlasEventType = mapEventToAtlasType(body.eventType);
    if (!atlasEventType) {
      return c.json({
        status: "ignored",
        eventType: body.eventType,
        correlationId,
      });
    }

    // Resolve tenantId — map from DocuSign account to AtlasIT tenant
    const tenantId = await resolveDocuSignAccountTenantId(
      c.env.DB,
      body.data?.accountId as string,
    );

    if (!tenantId) {
      console.log(
        JSON.stringify({
          level: "warn",
          correlationId,
          message: "No tenant mapping for DocuSign account",
          accountId: body.data?.accountId,
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
        source: "connector:docusign",
        payload: eventPayload,
        idempotencyKey:
          body.data?.userId ?? (body.data?.groupId as string | undefined),
        correlationId,
      });

      console.log(
        JSON.stringify({
          level: "info",
          correlationId,
          message: "DocuSign webhook event published",
          eventType: body.eventType,
          atlasEventType,
        }),
      );

      return c.json({
        status: "processed",
        eventType: body.eventType,
        atlasEventType,
        correlationId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          message: "Failed to publish DocuSign webhook event",
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
        message: "DocuSign webhook processing failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a DocuSign account ID to an AtlasIT tenant_id.
 * Uses the connector_configs table where connector_slug='docusign'.
 */
async function resolveDocuSignAccountTenantId(
  db: D1Database,
  accountId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'docusign' AND json_extract(config, '$.accountId') = ?
       LIMIT 1`,
    )
    .bind(accountId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
