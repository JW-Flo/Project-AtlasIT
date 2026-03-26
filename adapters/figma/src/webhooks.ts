import type { Context } from "hono";
import type { Bindings, Variables, FigmaWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Figma webhook signature using HMAC-SHA256.
 * Figma sends the signature in X-Figma-Signature as a hex digest.
 * Uses FIGMA_WEBHOOK_SECRET env var.
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

  // Constant-time comparison via length-check + char-by-char XOR
  if (signatureHeader.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < signatureHeader.length; i++) {
    mismatch |= signatureHeader.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

function mapEventToAtlasType(eventType: string): string | null {
  switch (eventType) {
    case "USER_JOINED":
      return "user.provisioned";
    case "USER_LEFT":
      return "user.deprovisioned";
    case "TEAM_MEMBER_JOINED":
      return "group.member_added";
    case "TEAM_MEMBER_LEFT":
      return "group.member_removed";
    default:
      return null;
  }
}

export async function handleFigmaWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Figma-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Figma-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.FIGMA_WEBHOOK_SECRET,
    rawBody,
    signatureHeader,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid Figma webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  let body: FigmaWebhookPayload;
  try {
    body = JSON.parse(rawBody) as FigmaWebhookPayload;
  } catch {
    return c.json({ error: "Invalid JSON payload", correlationId }, 400);
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Figma webhook received",
      eventType: body.event_type,
      teamId: body.team_id ?? "unknown",
    }),
  );

  const atlasEventType = mapEventToAtlasType(body.event_type);
  if (!atlasEventType) {
    return c.json({
      status: "ignored",
      event: body.event_type,
      correlationId,
    });
  }

  // Resolve tenantId from the team_id
  const tenantId = body.team_id
    ? await resolveTeamTenantId(c.env.DB, body.team_id)
    : null;

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        message: "No tenant mapping for Figma team",
        teamId: body.team_id,
      }),
    );
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
      source: "connector:figma",
      payload: {
        eventType: body.event_type,
        teamId: body.team_id,
        fileKey: body.file_key,
        triggeredBy: body.triggered_by,
      },
      correlationId,
    });

    return c.json({
      status: "processed",
      event: body.event_type,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Failed to publish Figma webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a Figma team_id to an AtlasIT tenant_id.
 */
async function resolveTeamTenantId(
  db: D1Database,
  teamId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'figma' AND json_extract(config, '$.teamId') = ?
       LIMIT 1`,
    )
    .bind(teamId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}

export function parseFigmaWebhookEvent(rawBody: string): unknown {
  return JSON.parse(rawBody);
}
