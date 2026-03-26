import type { AsanaUser, AsanaTeam, AsanaTeamMember } from "./types.js";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  // Asana rate limiting: Retry-After header on 429
  const remaining = parseInt(headers.get("X-RateLimit-Remaining") ?? "10", 10);
  const resetAt = parseInt(headers.get("X-RateLimit-Reset") ?? "0", 10) * 1000;
  return { remaining, resetAt };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

async function asanaFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ data: T; nextOffset: number | null }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Asana API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  const jsonData = (await response.json()) as {
    data: T;
    next_page?: { offset: number };
  };

  const nextOffset: number | null = jsonData.next_page?.offset ?? null;

  return { data: jsonData.data, nextOffset };
}

async function paginateAll<T>(
  url: string,
  accessToken: string,
  limit: number = 50,
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const separator = url.includes("?") ? "&" : "?";
    const paginatedUrl = `${url}${separator}limit=${limit}&offset=${offset}`;
    const response: { data: T[]; nextOffset: number | null } = await asanaFetch<
      T[]
    >(paginatedUrl, accessToken);

    if (Array.isArray(response.data)) {
      results.push(...response.data);
    }

    if (response.nextOffset !== null) {
      offset = response.nextOffset;
    } else {
      hasMore = false;
    }
  }

  return results;
}

// -- Users --

export async function listUsers(
  workspaceGid: string,
  accessToken: string,
): Promise<AsanaUser[]> {
  const url = `https://app.asana.com/api/1.0/workspaces/${encodeURIComponent(workspaceGid)}/users`;
  return paginateAll<AsanaUser>(url, accessToken);
}

export async function getUser(
  userGid: string,
  accessToken: string,
): Promise<AsanaUser> {
  const url = `https://app.asana.com/api/1.0/users/${encodeURIComponent(userGid)}`;
  const { data } = await asanaFetch<AsanaUser>(url, accessToken);
  return data;
}

// -- Teams --

export async function listTeams(
  workspaceGid: string,
  accessToken: string,
): Promise<AsanaTeam[]> {
  const url = `https://app.asana.com/api/1.0/organizations/${encodeURIComponent(workspaceGid)}/teams`;
  return paginateAll<AsanaTeam>(url, accessToken);
}

export async function getTeamMembers(
  teamGid: string,
  accessToken: string,
): Promise<AsanaTeamMember[]> {
  const url = `https://app.asana.com/api/1.0/teams/${encodeURIComponent(teamGid)}/users`;
  return paginateAll<AsanaTeamMember>(url, accessToken);
}
