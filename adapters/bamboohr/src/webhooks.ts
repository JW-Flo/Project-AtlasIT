import type { Context } from "hono";
import type { Bindings, Variables, BambooHRWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify BambooHR webhook signature using HMAC-SHA256.
 * BambooHR sends the signature in X-BambooHR-Signature header.
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
    case "employee.created":
      return "user.provisioned";
    case "employee.updated":
      return "user.updated";
    case "employee.deleted":
      return "user.deprovisioned";
    default:
      return null;
  }
}

function buildPayload(
  eventType: string,
  body: BambooHRWebhookPayload,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    eventType,
  };

  if (body.employee) {
    base.user = {
      id: body.employee.id,
      email: body.employee.email,
      displayName: `${body.employee.firstName} ${body.employee.lastName}`,
      department: body.employee.department,
      title: body.employee.jobTitle,
    };
  }

  return base;
}

export async function handleBambooHRWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-BambooHR-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-BambooHR-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.BAMBOOHR_WEBHOOK_SECRET,
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

  const body = JSON.parse(rawBody) as BambooHRWebhookPayload;
  const eventType = body.eventType;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "BambooHR webhook received",
      eventType,
    }),
  );

  const atlasEventType = mapEventToAtlasType(eventType);
  if (!atlasEventType) {
    return c.json({
      status: "ignored",
      eventType,
      correlationId,
    });
  }

  // Resolve tenantId from subdomain config in D1
  const tenantId = await resolveTenantId(c.env.DB);

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        message: "No tenant mapping found for BambooHR",
      }),
    );
    return c.json({
      status: "ignored",
      reason: "unmapped_tenant",
      correlationId,
    });
  }

  const eventPayload = buildPayload(eventType, body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:bamboohr",
      payload: eventPayload,
      idempotencyKey: body.eventId ?? undefined,
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
        message: "Failed to publish BambooHR webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve BambooHR connector to a tenant_id.
 * BambooHR typically has one per tenant.
 */
async function resolveTenantId(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'bamboohr'
       ORDER BY created_at DESC LIMIT 1`,
    )
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
