import { r as requireSlackSignature } from './slack-verify-DWbLguuy.js';

async function postMessage(token, channel, text) {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ channel, text })
  });
  return res.json();
}
const HANDLED_EVENT_TYPES = /* @__PURE__ */ new Set([
  "app_mention",
  "message",
  "reaction_added",
  "reaction_removed"
]);
async function handleSlackEvent(event, botToken, teamId) {
  const eventType = event.type ?? "";
  if (!HANDLED_EVENT_TYPES.has(eventType)) {
    console.log(
      JSON.stringify({
        level: "info",
        event: "slack.unhandled_event_type",
        type: eventType,
        team: teamId
      })
    );
    return { handled: false, eventType };
  }
  switch (eventType) {
    case "app_mention":
      return handleAppMention(event, botToken, teamId);
    case "message":
      return handleMessage(event, teamId);
    case "reaction_added":
    case "reaction_removed":
      return handleReaction(event, eventType, teamId);
    default:
      return { handled: false, eventType };
  }
}
async function handleAppMention(event, botToken, teamId) {
  if (!botToken) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "slack.mention_no_bot_token",
        team: teamId
      })
    );
    return { handled: false, eventType: "app_mention" };
  }
  const replyText = [
    `Hey <@${event.user}>! I'm the AtlasIT bot.`,
    "Use `/atlas help` to see available commands, or mention me with a question."
  ].join(" ");
  try {
    await postMessage(botToken, event.channel, replyText);
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "slack.mention_reply_failed",
        channel: event.channel,
        error: err instanceof Error ? err.message : "Unknown error"
      })
    );
  }
  return { handled: true, eventType: "app_mention" };
}
function handleMessage(event, teamId) {
  if (event.bot_id || event.subtype) {
    return { handled: false, eventType: "message" };
  }
  console.log(
    JSON.stringify({
      level: "info",
      event: "slack.message_logged",
      team: teamId,
      channel: event.channel,
      channelType: event.channel_type,
      user: event.user
    })
  );
  return { handled: true, eventType: "message" };
}
function handleReaction(event, eventType, teamId) {
  console.log(
    JSON.stringify({
      level: "info",
      event: `slack.${eventType}`,
      team: teamId,
      user: event.user,
      reaction: event.reaction,
      itemChannel: event.item?.channel
    })
  );
  return { handled: true, eventType };
}
const POST = async ({ request, platform }) => {
  const env = platform?.env;
  if (!env) {
    return new Response(JSON.stringify({ error: "no_env" }), { status: 500 });
  }
  const result = await requireSlackSignature(request, env);
  if (result instanceof Response) return result;
  const payload = JSON.parse(result.body);
  if (payload.type === "url_verification") {
    return new Response(JSON.stringify({ challenge: payload.challenge }), {
      headers: { "content-type": "application/json" }
    });
  }
  if (payload.type === "event_callback") {
    const event = payload.event;
    const teamId = payload.team_id ?? "";
    const botToken = env.SLACK_BOT_TOKEN ?? null;
    console.log(
      JSON.stringify({
        level: "info",
        event: "slack.event_received",
        type: event?.type,
        team: teamId
      })
    );
    if (event) {
      handleSlackEvent(event, botToken, teamId).catch((err) => {
        console.error(
          JSON.stringify({
            level: "error",
            event: "slack.event_handler_error",
            type: event?.type,
            error: err instanceof Error ? err.message : "Unknown error"
          })
        );
      });
    }
  }
  return new Response(null, { status: 200 });
};

export { POST };
//# sourceMappingURL=_server.ts-CK2xaSls.js.map
