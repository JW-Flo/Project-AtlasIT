import type {
  SlackUser,
  SlackChannel,
  SlackMessage,
  SlackBlock,
  SlackApiResponse,
} from "./types.js";

const SLACK_API_BASE = "https://slack.com/api";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

class SlackApiError extends Error {
  constructor(
    public readonly method: string,
    public readonly slackError: string,
  ) {
    super(`Slack API error in ${method}: ${slackError}`);
    this.name = "SlackApiError";
  }
}

async function slackFetch<T extends SlackApiResponse>(
  method: string,
  token: string,
  params?: Record<string, string>,
  body?: Record<string, unknown>,
): Promise<T> {
  const url = new URL(`${SLACK_API_BASE}/${method}`);

  const isGet = !body;

  if (isGet && params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: isGet ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    ...(body ? { body: JSON.stringify({ ...body, ...params }) } : {}),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown HTTP error");
    throw new Error(
      `Slack HTTP error in ${method} (${response.status}): ${text}`,
    );
  }

  const data = (await response.json()) as T;

  if (!data.ok) {
    throw new SlackApiError(method, data.error ?? "unknown_error");
  }

  return data;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function listUsers(
  token: string,
  options?: { limit?: number },
): Promise<SlackUser[]> {
  const limit = String(options?.limit ?? 200);
  const users: SlackUser[] = [];
  let cursor: string | undefined;

  do {
    const params: Record<string, string> = { limit };
    if (cursor) {
      params.cursor = cursor;
    }

    const result = await slackFetch<SlackApiResponse>(
      "users.list",
      token,
      params,
    );

    if (result.members) {
      users.push(...result.members);
    }

    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return users;
}

export async function getUser(
  token: string,
  userId: string,
): Promise<SlackUser> {
  const result = await slackFetch<SlackApiResponse & { user: SlackUser }>(
    "users.info",
    token,
    { user: userId },
  );

  return result.user;
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

export async function listChannels(
  token: string,
  options?: { types?: string; limit?: number; excludeArchived?: boolean },
): Promise<SlackChannel[]> {
  const limit = String(options?.limit ?? 200);
  const types = options?.types ?? "public_channel,private_channel";
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const params: Record<string, string> = {
      limit,
      types,
      exclude_archived: String(options?.excludeArchived ?? true),
    };
    if (cursor) {
      params.cursor = cursor;
    }

    const result = await slackFetch<SlackApiResponse>(
      "conversations.list",
      token,
      params,
    );

    if (result.channels) {
      channels.push(...result.channels);
    }

    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return channels;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export async function sendMessage(
  token: string,
  channel: string,
  text: string,
  blocks?: SlackBlock[],
): Promise<SlackMessage> {
  const body: Record<string, unknown> = { channel, text };
  if (blocks?.length) {
    body.blocks = blocks;
  }

  const result = await slackFetch<SlackApiResponse>(
    "chat.postMessage",
    token,
    undefined,
    body,
  );

  return {
    ok: true,
    channel: (result.channel as string) ?? channel,
    ts: (result.ts as string) ?? "",
  };
}

export async function sendDirectMessage(
  token: string,
  userId: string,
  text: string,
  blocks?: SlackBlock[],
): Promise<SlackMessage> {
  // Open a DM conversation with the user
  const openResult = await slackFetch<SlackApiResponse>(
    "conversations.open",
    token,
    undefined,
    { users: userId },
  );

  // conversations.open returns channel as { id: string } object
  const channelObj = openResult.channel as unknown as { id: string } | string;
  const dmChannelId =
    typeof channelObj === "object" ? channelObj.id : String(channelObj);

  return sendMessage(token, dmChannelId, text, blocks);
}

export { SlackApiError };
