import type { Context } from "hono";
import type { Bindings, Variables, CanvaWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Canva webhook signature using HMAC-SHA256.
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
    case "user.created":
      return "user.provisioned";
    case "user.deleted":
      return "user.deprovisioned";
    case "user.updated":
      return "user.updated";
    default:
      return null;
  }
}

export async function handleCanvaWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Canva-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Canva-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.CANVA_WEBHOOK_SECRET,
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

  const body = JSON.parse(rawBody) as CanvaWebhookPayload;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Canva webhook received",
      eventType: body.event_type,
    }),
  );

  const atlasEventType = mapEventToAtlasType(body.event_type);
  if (!atlasEventType) {
    return c.json({
      status: "ignored",
      eventType: body.event_type,
      correlationId,
    });
  }

  const tenantId = await resolveTenantId(c.env.DB);
  if (!tenantId) {
    return c.json({
      status: "ignored",
      reason: "unmapped_team",
      correlationId,
    });
  }

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:canva",
      payload: {
        canvaEvent: body.event_type,
        user: body.user,
        teamId: body.team_id,
      },
      correlationId,
    });

    return c.json({
      status: "processed",
      eventType: body.event_type,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Failed to publish Canva webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve Canva team to an AtlasIT tenant_id.
 */
async function resolveTenantId(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'canva'
       LIMIT 1`,
    )
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
