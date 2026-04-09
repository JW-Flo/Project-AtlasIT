/**
 * Slack event dispatch logic for Events API callbacks.
 * Handles app_mention, message, and reaction events.
 */

import { postMessage } from "./api";

export interface EventResult {
  handled: boolean;
  eventType: string;
}

const HANDLED_EVENT_TYPES = new Set([
  "app_mention",
  "message",
  "reaction_added",
  "reaction_removed",
]);

export async function handleSlackEvent(
  event: any,
  botToken: string | null | undefined,
  teamId: string,
): Promise<EventResult> {
  const eventType: string = event.type ?? "";

  if (!HANDLED_EVENT_TYPES.has(eventType)) {
    console.log(
      JSON.stringify({
        level: "info",
        event: "slack.unhandled_event_type",
        type: eventType,
        team: teamId,
      }),
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

async function handleAppMention(
  event: any,
  botToken: string | null | undefined,
  teamId: string,
): Promise<EventResult> {
  if (!botToken) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "slack.mention_no_bot_token",
        team: teamId,
      }),
    );
    return { handled: false, eventType: "app_mention" };
  }

  const replyText = [
    `Hey <@${event.user}>! I'm the AtlasIT bot.`,
    "Use `/atlas help` to see available commands, or mention me with a question.",
  ].join(" ");

  try {
    await postMessage(botToken, event.channel, replyText);
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "slack.mention_reply_failed",
        channel: event.channel,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
    );
  }

  return { handled: true, eventType: "app_mention" };
}

function handleMessage(event: any, teamId: string): EventResult {
  // Skip bot messages and subtypes (joins, leaves, etc.)
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
      user: event.user,
    }),
  );

  return { handled: true, eventType: "message" };
}

function handleReaction(event: any, eventType: string, teamId: string): EventResult {
  console.log(
    JSON.stringify({
      level: "info",
      event: `slack.${eventType}`,
      team: teamId,
      user: event.user,
      reaction: event.reaction,
      itemChannel: event.item?.channel,
    }),
  );

  return { handled: true, eventType };
}
