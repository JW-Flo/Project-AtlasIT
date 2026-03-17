import type { DiscordUser, DiscordMember, DiscordRole } from "./types.js";

const API_BASE = "https://discord.com/api/v10";

interface PaginationResult<T> {
  data: T[];
  after?: string;
}

async function discordFetch<T>(
  url: string,
  botToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ data: T; after?: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bot ${botToken}`,
    "Content-Type": "application/json",
  };

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Discord API error (${response.status}): ${errorBody}`);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return { data: undefined as T };
  }

  const data = (await response.json()) as T;

  return { data };
}

async function paginateAll<T>(
  initialUrl: string,
  botToken: string,
): Promise<T[]> {
  const results: T[] = [];
  let after: string | undefined;

  while (true) {
    const url = after ? `${initialUrl}&after=${after}` : initialUrl;
    const response = await discordFetch<T[]>(url, botToken);
    const pageData = response.data || [];

    if (pageData.length === 0) break;

    results.push(...pageData);

    // For snowflakes, check if we have the full page (100 items)
    // If less than 100, we've reached the end
    if (pageData.length < 100) {
      break;
    }

    // Use last item's ID as 'after' cursor (snowflake)
    const lastItem = pageData[pageData.length - 1] as unknown as {
      id: string;
    };
    after = lastItem.id;
  }

  return results;
}

// -- Guild members --

export async function listGuildMembers(
  guildId: string,
  botToken: string,
): Promise<DiscordMember[]> {
  const url = `${API_BASE}/guilds/${encodeURIComponent(guildId)}/members?limit=100`;
  const members = await paginateAll<DiscordMember>(url, botToken);
  return members;
}

export async function getGuildMember(
  guildId: string,
  userId: string,
  botToken: string,
): Promise<DiscordMember> {
  const url = `${API_BASE}/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`;
  const { data } = await discordFetch<DiscordMember>(url, botToken);
  return data;
}

export async function addGuildMember(
  guildId: string,
  userId: string,
  botToken: string,
  accessToken: string,
  roles?: string[],
): Promise<DiscordMember | null> {
  const url = `${API_BASE}/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`;
  const { data } = await discordFetch<DiscordMember | null>(
    url,
    botToken,
    "PUT",
    {
      access_token: accessToken,
      roles: roles || [],
    },
  );
  return data;
}

export async function removeGuildMember(
  guildId: string,
  userId: string,
  botToken: string,
): Promise<void> {
  const url = `${API_BASE}/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`;
  await discordFetch<void>(url, botToken, "DELETE");
}

// -- Roles --

export async function listGuildRoles(
  guildId: string,
  botToken: string,
): Promise<DiscordRole[]> {
  const url = `${API_BASE}/guilds/${encodeURIComponent(guildId)}/roles`;
  const { data } = await discordFetch<DiscordRole[]>(url, botToken);
  return data || [];
}

export async function createGuildRole(
  guildId: string,
  botToken: string,
  name: string,
): Promise<DiscordRole> {
  const url = `${API_BASE}/guilds/${encodeURIComponent(guildId)}/roles`;
  const { data } = await discordFetch<DiscordRole>(url, botToken, "POST", {
    name,
  });
  return data;
}

// -- User lookup --

export async function getUser(
  userId: string,
  botToken: string,
): Promise<DiscordUser> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
  const { data } = await discordFetch<DiscordUser>(url, botToken);
  return data;
}
