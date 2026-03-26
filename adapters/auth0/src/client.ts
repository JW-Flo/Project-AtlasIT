import type { Auth0User, Auth0Organization, Auth0Member } from "./types.js";

const DEFAULT_PAGE_SIZE = 50;

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const remaining = parseInt(headers.get("X-RateLimit-Remaining") ?? "99", 10);
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

async function auth0Fetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
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
    throw new Error(`Auth0 API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// -- Users --

export async function listUsers(
  domain: string,
  accessToken: string,
): Promise<Auth0User[]> {
  const results: Auth0User[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `https://${domain}/api/v2/users?per_page=${DEFAULT_PAGE_SIZE}&page=${page}&include_totals=true`;
    const response = await auth0Fetch<{
      users: Auth0User[];
      total: number;
      start: number;
      length: number;
    }>(url, accessToken);

    results.push(...response.users);
    page++;
    hasMore = results.length < response.total;
  }

  return results;
}

export async function getUser(
  domain: string,
  userId: string,
  accessToken: string,
): Promise<Auth0User> {
  const url = `https://${domain}/api/v2/users/${encodeURIComponent(userId)}`;
  return auth0Fetch<Auth0User>(url, accessToken);
}

// -- Organizations --

export async function listOrganizations(
  domain: string,
  accessToken: string,
): Promise<Auth0Organization[]> {
  const results: Auth0Organization[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `https://${domain}/api/v2/organizations?per_page=${DEFAULT_PAGE_SIZE}&page=${page}&include_totals=true`;
    const response = await auth0Fetch<{
      organizations: Auth0Organization[];
      total: number;
      start: number;
      length: number;
    }>(url, accessToken);

    results.push(...response.organizations);
    page++;
    hasMore = results.length < response.total;
  }

  return results;
}

export async function getOrganizationMembers(
  domain: string,
  orgId: string,
  accessToken: string,
): Promise<Auth0Member[]> {
  const results: Auth0Member[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `https://${domain}/api/v2/organizations/${encodeURIComponent(orgId)}/members?per_page=${DEFAULT_PAGE_SIZE}&page=${page}&include_totals=true`;
    const response = await auth0Fetch<{
      members: Auth0Member[];
      total: number;
      start: number;
      length: number;
    }>(url, accessToken);

    results.push(...response.members);
    page++;
    hasMore = results.length < response.total;
  }

  return results;
}
