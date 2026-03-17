import type {
  Bindings,
  SlackEventBody,
  SlackEventCallback,
  SlackInteractionPayload,
} from "./types.js";
import { publishEvent } from "./event-publisher.js";

// ---------------------------------------------------------------------------
// Slack request signature verification (v0 signing)
// See: https://api.slack.com/authentication/verifying-requests-from-slack
// ---------------------------------------------------------------------------

export async function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  rawBody: string,
): Promise<boolean> {
  // Reject requests older than 5 minutes to prevent replay attacks
  const requestAge = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (requestAge > 300) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(sigBasestring),
  );

  const computedSig =
    "v0=" +
    Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  // Constant-time comparison
  if (signature.length !== computedSig.length) {
    return false;
  }

  const a = encoder.encode(signature);
  const b = encoder.encode(computedSig);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }

  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// URL verification handler (Slack Events API setup)
// ---------------------------------------------------------------------------

export function handleUrlVerification(body: SlackEventBody): Response {
  if (body.type !== "url_verification") {
    return new Response(JSON.stringify({ error: "Not a url_verification" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ challenge: body.challenge }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Event routing
// ---------------------------------------------------------------------------

const EVENT_TYPE_MAP: Record<string, string> = {
  member_joined_channel: "slack.member.joined_channel",
  member_left_channel: "slack.member.left_channel",
  channel_created: "slack.channel.created",
  channel_deleted: "slack.channel.deleted",
  channel_archive: "slack.channel.archived",
  channel_unarchive: "slack.channel.unarchived",
  team_join: "slack.user.joined",
  user_change: "slack.user.updated",
  message: "slack.message.received",
};

export async function handleEvent(
  body: SlackEventCallback,
  env: Bindings,
  tenantId: string,
  correlationId: string,
): Promise<{ processed: boolean; eventType: string | null }> {
  const event = body.event;
  const atlasEventType = EVENT_TYPE_MAP[event.type];

  if (!atlasEventType) {
    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        message: "Unhandled Slack event type",
        eventType: event.type,
        eventId: body.event_id,
      }),
    );
    return { processed: false, eventType: null };
  }

  // Skip bot messages and message subtypes we don't care about
  if (event.type === "message" && event.subtype) {
    return { processed: false, eventType: null };
  }

  try {
    await publishEvent({
      orchestratorUrl: env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:slack",
      payload: {
        slackEventId: body.event_id,
        slackEventType: event.type,
        teamId: body.team_id,
        user: event.user,
        channel: event.channel,
        channelType: event.channel_type,
        timestamp: event.event_ts,
      },
      idempotencyKey: body.event_id,
      correlationId,
    });

    return { processed: true, eventType: atlasEventType };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Failed to publish Slack event",
        eventId: body.event_id,
        eventType: event.type,
        error: msg,
      }),
    );
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Interactive component handler (button clicks, etc.)
// ---------------------------------------------------------------------------

export async function handleInteraction(
  payload: SlackInteractionPayload,
  env: Bindings,
  tenantId: string,
  correlationId: string,
): Promise<{ processed: boolean; actions: string[] }> {
  if (payload.type !== "block_actions" || !payload.actions?.length) {
    return { processed: false, actions: [] };
  }

  const processedActions: string[] = [];

  for (const action of payload.actions) {
    if (
      action.action_id === "approval_approve" ||
      action.action_id === "approval_deny"
    ) {
      const decision =
        action.action_id === "approval_approve" ? "approved" : "denied";

      let requestData: { requestId: string; callbackUrl?: string } | null =
        null;
      try {
        requestData = JSON.parse(action.value ?? "{}") as {
          requestId: string;
          callbackUrl?: string;
        };
      } catch {
        // Malformed action value — log and continue
        console.error(
          JSON.stringify({
            level: "error",
            correlationId,
            message: "Malformed approval action value",
            actionId: action.action_id,
            value: action.value,
          }),
        );
        continue;
      }

      await publishEvent({
        orchestratorUrl: env.ORCHESTRATOR_URL,
        tenantId,
        type: "approval.decision",
        source: "connector:slack",
        payload: {
          requestId: requestData.requestId,
          decision,
          decidedBy: payload.user.id,
          decidedByUsername: payload.user.username,
          timestamp: action.action_ts,
          channel: payload.channel?.id,
        },
        idempotencyKey: `${requestData.requestId}-${decision}-${action.action_ts}`,
        correlationId,
      });

      // Send callback to the original requester's system if configured
      if (requestData.callbackUrl) {
        try {
          await fetch(requestData.callbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId: requestData.requestId,
              decision,
              decidedBy: payload.user.id,
            }),
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          console.error(
            JSON.stringify({
              level: "error",
              correlationId,
              message: "Approval callback failed",
              callbackUrl: requestData.callbackUrl,
              error: msg,
            }),
          );
          // Non-fatal — the event was already published
        }
      }

      // Acknowledge to the user via response_url
      if (payload.response_url) {
        try {
          await fetch(payload.response_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              replace_original: true,
              text: `Request ${decision} by <@${payload.user.id}>`,
            }),
          });
        } catch {
          // Best-effort acknowledgment
        }
      }

      processedActions.push(action.action_id);
    } else {
      // Forward unknown actions as generic events
      await publishEvent({
        orchestratorUrl: env.ORCHESTRATOR_URL,
        tenantId,
        type: "slack.interaction",
        source: "connector:slack",
        payload: {
          actionId: action.action_id,
          blockId: action.block_id,
          value: action.value,
          userId: payload.user.id,
          channel: payload.channel?.id,
        },
        correlationId,
      });

      processedActions.push(action.action_id);
    }
  }

  return { processed: processedActions.length > 0, actions: processedActions };
}
