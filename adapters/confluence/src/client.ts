import type {
  ConfluenceUser,
  ConfluenceGroup,
  ConfluenceGroupUser,
} from "./types.js";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const remaining = parseInt(
    headers.get("X-RateLimit-Limit-User-Remaining") ?? "999",
    10,
  );
  const resetAt =
    parseInt(headers.get("X-RateLimit-Limit-User-Reset") ?? "0", 10) * 1000;
  return { remaining, resetAt };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

async function confluenceFetch<T>(
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
    throw new Error(`Confluence API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  if (response.status === 204) {
    return { data: undefined as T, nextCursor: null };
  }

  const data = (await response.json()) as T;

  // Extract cursor from Link header if present
  let nextCursor: string | null = null;
  const linkHeader = response.headers.get("Link");
  if (linkHeader) {
    const cursorMatch = linkHeader.match(/start=(\d+)/);
    if (cursorMatch) {
      nextCursor = cursorMatch[1];
    }
  }

  return { data, nextCursor };
}

async function paginateAll<T>(
  url: string,
  accessToken: string,
  cloudId: string,
  limit: number = 50,
): Promise<T[]> {
  const results: T[] = [];
  let start = 0;
  let hasMore = true;

  while (hasMore) {
    const paginatedUrl = `${url}?start=${start}&limit=${limit}`;
    const response: { data: T; nextCursor: string | null } =
      await confluenceFetch<T>(paginatedUrl, accessToken);

    if (Array.isArray(response.data)) {
      results.push(...(response.data as T[]));
    }

    if (response.nextCursor) {
      start = parseInt(response.nextCursor, 10);
    } else {
      hasMore = false;
    }
  }

  return results;
}

// -- Users --

export async function listUsers(
  cloudId: string,
  accessToken: string,
): Promise<ConfluenceUser[]> {
  const url = `https://api.atlassian.com/ex/confluence/${encodeURIComponent(cloudId)}/admin/users/search`;
  return paginateAll<ConfluenceUser>(url, accessToken, cloudId);
}

export async function getUser(
  cloudId: string,
  accountId: string,
  accessToken: string,
): Promise<ConfluenceUser> {
  const url = `https://api.atlassian.com/ex/confluence/${encodeURIComponent(cloudId)}/admin/users/${encodeURIComponent(accountId)}`;
  const { data } = await confluenceFetch<ConfluenceUser>(url, accessToken);
  return data;
}

// -- Groups --

export async function listGroups(
  cloudId: string,
  accessToken: string,
): Promise<ConfluenceGroup[]> {
  const url = `https://api.atlassian.com/ex/confluence/${encodeURIComponent(cloudId)}/admin/groups`;
  return paginateAll<ConfluenceGroup>(url, accessToken, cloudId);
}

export async function getGroupMembers(
  cloudId: string,
  groupName: string,
  accessToken: string,
): Promise<ConfluenceGroupUser[]> {
  const url = `https://api.atlassian.com/ex/confluence/${encodeURIComponent(cloudId)}/admin/groups/${encodeURIComponent(groupName)}/members`;
  return paginateAll<ConfluenceGroupUser>(url, accessToken, cloudId);
}
