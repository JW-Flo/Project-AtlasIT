import type { Context } from "hono";
import type { Bindings, Variables, DiscordWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// Interact with Discord API via this endpoint
const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Verify Discord interaction signature using Ed25519.
 * Discord sends: X-Signature-Ed25519 and X-Signature-Timestamp headers.
 */
async function verifyDiscordSignature(
  publicKey: string,
  timestamp: string,
  signature: string,
  rawBody: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + rawBody);

    // Decode hex signature to bytes
    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );

    // Import Ed25519 public key
    const key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(
        publicKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
      ),
      "Ed25519",
      false,
      ["verify"],
    );

    // Verify signature
    const valid = await crypto.subtle.verify("Ed25519", key, sigBytes, message);
    return valid;
  } catch (err) {
    console.error("Ed25519 verification error:", err);
    return false;
  }
}

function mapEventToAtlasType(payload: DiscordWebhookPayload): string | null {
  // For now, we map interaction events. In a real implementation,
  // you might handle more Discord events (e.g., guild member add/remove).
  switch (payload.type) {
    case 2: // APPLICATION_COMMAND
      return "command.executed";
    case 3: // MESSAGE_COMPONENT
      return "component.interacted";
    case 4: // APPLICATION_AUTOCOMPLETE
      return "autocomplete.executed";
    case 5: // MODAL_SUBMIT
      return "modal.submitted";
    default:
      return null;
  }
}

function buildPayload(payload: DiscordWebhookPayload): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: payload.type,
    id: payload.id,
    applicationId: payload.application_id,
    guildId: payload.guild_id,
    channelId: payload.channel_id,
    data: payload.data,
  };

  if (payload.member) {
    base.member = {
      id: payload.member.user?.id,
      username: payload.member.user?.username,
      roles: payload.member.roles,
    };
  }

  if (payload.user) {
    base.user = {
      id: payload.user.id,
      username: payload.user.username,
    };
  }

  return base;
}

export async function handleDiscordWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signature = c.req.header("X-Signature-Ed25519");
  const timestamp = c.req.header("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return c.json(
      {
        error: "Missing X-Signature-Ed25519 or X-Signature-Timestamp header",
        correlationId,
      },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifyDiscordSignature(
    c.env.DISCORD_PUBLIC_KEY,
    timestamp,
    signature,
    rawBody,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid Discord webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  // Handle ping (sent when webhook is first configured)
  const body = JSON.parse(rawBody) as DiscordWebhookPayload;
  if (body.type === 1) {
    // PING type
    return c.json({ type: 1 }, 200); // PONG
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Discord interaction received",
      type: body.type,
      guildId: body.guild_id,
    }),
  );

  const atlasEventType = mapEventToAtlasType(body);
  if (!atlasEventType) {
    return c.json({
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: { content: "Unknown interaction type" },
    });
  }

  // Resolve tenantId from guild
  const tenantId = await resolveGuildTenantId(c.env.DB, body.guild_id ?? "");

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        message: "No tenant mapping for Discord guild",
        guildId: body.guild_id,
      }),
    );
    return c.json({
      type: 4,
      data: { content: "Guild not configured" },
    });
  }

  const eventPayload = buildPayload(body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:discord",
      payload: eventPayload,
      idempotencyKey: body.id,
      correlationId,
    });

    // Acknowledge interaction with empty response
    return c.json({ type: 1 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Failed to publish Discord webhook event",
        error: msg,
      }),
    );
    return c.json({
      type: 4,
      data: { content: "Failed to process interaction" },
    });
  }
}

/**
 * Resolve a Discord guild to an AtlasIT tenant_id.
 */
async function resolveGuildTenantId(
  db: D1Database,
  guildId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'discord' AND json_extract(config, '$.guildId') = ?
       LIMIT 1`,
    )
    .bind(guildId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
