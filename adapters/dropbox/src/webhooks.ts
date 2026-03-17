import type { Context } from "hono";
import type { Bindings, Variables, DropboxWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Dropbox webhook signature using HMAC-SHA256.
 * Dropbox sends the signature in X-Dropbox-Signature as hex-encoded HMAC-SHA256.
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
    case "member_added":
      return "user.provisioned";
    case "member_removed":
      return "user.deprovisioned";
    case "group_member_added":
      return "group.member_added";
    case "group_member_removed":
      return "group.member_removed";
    default:
      return null;
  }
}

export async function handleDropboxWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Dropbox-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Dropbox-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.DROPBOX_WEBHOOK_SECRET,
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

  const body = JSON.parse(rawBody) as DropboxWebhookPayload;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Dropbox webhook received",
    }),
  );

  // Process member events
  if (body.list_members_events) {
    for (const event of body.list_members_events) {
      const atlasEventType = mapEventToAtlasType(event.type);
      if (!atlasEventType) continue;

      const tenantId = await resolveTeamTenantId(c.env.DB);
      if (!tenantId) continue;

      try {
        await publishEvent({
          orchestratorUrl: c.env.ORCHESTRATOR_URL,
          tenantId,
          type: atlasEventType,
          source: "connector:dropbox",
          payload: {
            dropboxEvent: event.type,
            accountId: event.account_id,
            email: event.email,
            displayName: event.display_name,
          },
          correlationId,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(
          JSON.stringify({
            level: "error",
            correlationId,
            message: "Failed to publish Dropbox webhook event",
            error: msg,
          }),
        );
      }
    }
  }

  // Process group events
  if (body.list_groups_events) {
    for (const event of body.list_groups_events) {
      const atlasEventType = mapEventToAtlasType(event.type);
      if (!atlasEventType) continue;

      const tenantId = await resolveTeamTenantId(c.env.DB);
      if (!tenantId) continue;

      try {
        await publishEvent({
          orchestratorUrl: c.env.ORCHESTRATOR_URL,
          tenantId,
          type: atlasEventType,
          source: "connector:dropbox",
          payload: {
            dropboxEvent: event.type,
            groupId: event.group_id,
            accountId: event.account_id,
          },
          correlationId,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(
          JSON.stringify({
            level: "error",
            correlationId,
            message: "Failed to publish Dropbox webhook event",
            error: msg,
          }),
        );
      }
    }
  }

  return c.json({ status: "processed", correlationId });
}

/**
 * Resolve Dropbox team to an AtlasIT tenant_id.
 * Uses the connector_configs table where connector_slug='dropbox'.
 */
async function resolveTeamTenantId(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'dropbox'
       LIMIT 1`,
    )
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
