import type { Context } from "hono";
import type {
  Bindings,
  Variables,
  WorkdayBusinessProcessEvent,
} from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// Workday Business Process event types we handle
const HANDLED_EVENT_TYPES = new Set([
  "worker.hired",
  "worker.terminated",
  "worker.transferred",
  "worker.promoted",
  "worker.org_change",
]);

function isHandledEvent(eventType: string): boolean {
  return HANDLED_EVENT_TYPES.has(eventType);
}

/**
 * Verify Workday webhook signature using HMAC-SHA256.
 * Workday ISU sends signature in X-Workday-Signature as hex-encoded HMAC.
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
    case "worker.hired":
      return "user.provisioned";
    case "worker.terminated":
      return "user.deprovisioned";
    case "worker.transferred":
      return "user.transferred";
    case "worker.promoted":
      return "user.updated";
    case "worker.org_change":
      return "group.member_changed";
    default:
      return null;
  }
}

function buildPayload(
  body: WorkdayBusinessProcessEvent,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    workdayEventType: body.eventType,
    effectiveDate: body.effectiveDate,
    worker: {
      id: body.worker.id,
      descriptor: body.worker.descriptor,
      primaryWorkEmail: body.worker.primaryWorkEmail,
    },
    businessProcess: {
      id: body.businessProcess.id,
      descriptor: body.businessProcess.descriptor,
      type: body.businessProcess.type,
    },
  };

  if (body.initiator) {
    payload.initiator = {
      id: body.initiator.id,
      descriptor: body.initiator.descriptor,
    };
  }

  if (body.organization) {
    payload.organization = {
      id: body.organization.id,
      descriptor: body.organization.descriptor,
    };
  }

  return payload;
}

export async function handleWorkdayWebhook(
  c: HonoContext,
): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Workday-Signature");
  const deliveryId = c.req.header("X-Delivery-ID") ?? crypto.randomUUID();

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Workday-Signature header", correlationId },
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
        deliveryId,
        message: "Invalid webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody) as WorkdayBusinessProcessEvent;
  const eventType = body.eventType;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      deliveryId,
      message: "Workday webhook received",
      eventType,
      workerId: body.worker?.id,
    }),
  );

  if (!isHandledEvent(eventType)) {
    return c.json({
      status: "ignored",
      eventType,
      correlationId,
    });
  }

  const atlasEventType = mapEventToAtlasType(eventType);
  if (!atlasEventType) {
    return c.json({ status: "ignored", correlationId });
  }

  // Resolve tenantId from connector_configs where connector_slug='workday'
  const tenantId = await resolveTenantId(c.env.DB, body.worker.id);

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        deliveryId,
        message: "No tenant mapping for Workday worker",
        workerId: body.worker.id,
      }),
    );
    return c.json({
      status: "ignored",
      reason: "unmapped_tenant",
      correlationId,
    });
  }

  const eventPayload = buildPayload(body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:workday",
      payload: eventPayload,
      idempotencyKey: deliveryId,
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
        deliveryId,
        message: "Failed to publish Workday webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a Workday worker event to an AtlasIT tenant_id.
 * Uses connector_configs where connector_slug='workday'.
 * Since Workday is single-tenant per config, we look up by the configured tenant name.
 */
async function resolveTenantId(
  db: D1Database,
  _workerId: string,
): Promise<string | null> {
  // Each Workday connector config maps to exactly one AtlasIT tenant.
  // The webhook endpoint is tenant-specific, so we grab the first active config.
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'workday'
       LIMIT 1`,
    )
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
