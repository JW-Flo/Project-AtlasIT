import type { FigmaUser, FigmaTeamMember } from "./types.js";

const API_BASE = "https://api.figma.com/v1";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const remaining = parseInt(headers.get("X-RateLimit-Remaining") ?? "60", 10);
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

async function figmaFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ data: T; nextCursor: string | null }> {
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
    throw new Error(`Figma API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  const jsonData = (await response.json()) as {
    data: T;
    cursor?: string;
  };

  const nextCursor: string | null = jsonData.cursor ?? null;

  return { data: jsonData.data, nextCursor };
}

async function paginateAll<T>(url: string, accessToken: string): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | null = null;

  while (true) {
    const separator = url.includes("?") ? "&" : "?";
    const paginatedUrl = cursor
      ? `${url}${separator}cursor=${encodeURIComponent(cursor)}`
      : url;
    const response: { data: T[]; nextCursor: string | null } = await figmaFetch<
      T[]
    >(paginatedUrl, accessToken);

    if (Array.isArray(response.data)) {
      results.push(...response.data);
    }

    if (response.nextCursor) {
      cursor = response.nextCursor;
    } else {
      break;
    }
  }

  return results;
}

// -- Users --

export async function listTeamMembers(
  teamId: string,
  accessToken: string,
): Promise<FigmaUser[]> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}/members`;
  return paginateAll<FigmaUser>(url, accessToken);
}

export async function getUser(
  userId: string,
  accessToken: string,
): Promise<FigmaUser> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
  const { data } = await figmaFetch<FigmaUser>(url, accessToken);
  return data;
}

// -- Groups (Teams) --

export async function listTeams(
  orgId: string,
  accessToken: string,
): Promise<Array<{ id: string; name: string; description?: string }>> {
  const url = `${API_BASE}/orgs/${encodeURIComponent(orgId)}/teams`;
  return paginateAll<{
    id: string;
    name: string;
    description?: string;
  }>(url, accessToken);
}

export async function getTeam(
  teamId: string,
  accessToken: string,
): Promise<{ id: string; name: string; description?: string }> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}`;
  const { data } = await figmaFetch<{
    id: string;
    name: string;
    description?: string;
  }>(url, accessToken);
  return data;
}
