import type { Context } from "hono";
import type { Bindings, Variables, MondayWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Monday.com webhook signature using HMAC-SHA256.
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

function mapEventToAtlasType(trigger: string): string | null {
  switch (trigger) {
    case "user.created":
      return "user.provisioned";
    case "user.deleted":
      return "user.deprovisioned";
    case "user.updated":
      return "user.updated";
    case "team.member_added":
      return "group.member_added";
    case "team.member_removed":
      return "group.member_removed";
    default:
      return null;
  }
}

export async function handleMondayWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Hub-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Hub-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.MONDAY_WEBHOOK_SECRET,
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

  const body = JSON.parse(rawBody) as MondayWebhookPayload;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Monday.com webhook received",
      trigger: body.trigger,
    }),
  );

  const atlasEventType = mapEventToAtlasType(body.trigger);
  if (!atlasEventType) {
    return c.json({ status: "ignored", trigger: body.trigger, correlationId });
  }

  const tenantId = await resolveTenantId(c.env.DB);
  if (!tenantId) {
    return c.json({
      status: "ignored",
      reason: "unmapped_account",
      correlationId,
    });
  }

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:monday",
      payload: {
        mondayTrigger: body.trigger,
        user: body.user,
        team: body.team,
      },
      correlationId,
    });

    return c.json({
      status: "processed",
      trigger: body.trigger,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Failed to publish Monday.com webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve Monday.com account to an AtlasIT tenant_id.
 */
async function resolveTenantId(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'monday'
       LIMIT 1`,
    )
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
