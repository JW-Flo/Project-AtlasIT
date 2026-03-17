import type { ZendeskUser, ZendeskOrganization } from "./types.js";

const DEFAULT_PAGE_SIZE = 100;

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const remaining = parseInt(headers.get("X-Rate-Limit-Remaining") ?? "99", 10);
  const resetAt =
    parseInt(headers.get("Retry-After") ?? "0", 10) * 1000 + Date.now();
  return { remaining, resetAt };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

async function zendeskFetch<T>(
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
    throw new Error(`Zendesk API error (${response.status}): ${errorBody}`);
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
  subdomain: string,
  accessToken: string,
): Promise<ZendeskUser[]> {
  const results: ZendeskUser[] = [];
  let url: string | null =
    `https://${subdomain}.zendesk.com/api/v2/users.json?per_page=${DEFAULT_PAGE_SIZE}`;

  while (url) {
    const response = await zendeskFetch<{
      users: ZendeskUser[];
      next_page: string | null;
      count: number;
    }>(url, accessToken);

    results.push(...response.users);
    url = response.next_page;
  }

  return results;
}

export async function getUser(
  subdomain: string,
  userId: number,
  accessToken: string,
): Promise<ZendeskUser> {
  const url = `https://${subdomain}.zendesk.com/api/v2/users/${userId}.json`;
  const response = await zendeskFetch<{ user: ZendeskUser }>(url, accessToken);
  return response.user;
}

// -- Organizations (used as groups) --

export async function listOrganizations(
  subdomain: string,
  accessToken: string,
): Promise<ZendeskOrganization[]> {
  const results: ZendeskOrganization[] = [];
  let url: string | null =
    `https://${subdomain}.zendesk.com/api/v2/organizations.json?per_page=${DEFAULT_PAGE_SIZE}`;

  while (url) {
    const response = await zendeskFetch<{
      organizations: ZendeskOrganization[];
      next_page: string | null;
      count: number;
    }>(url, accessToken);

    results.push(...response.organizations);
    url = response.next_page;
  }

  return results;
}

export async function getOrganizationUsers(
  subdomain: string,
  orgId: number,
  accessToken: string,
): Promise<ZendeskUser[]> {
  const results: ZendeskUser[] = [];
  let url: string | null =
    `https://${subdomain}.zendesk.com/api/v2/organizations/${orgId}/users.json?per_page=${DEFAULT_PAGE_SIZE}`;

  while (url) {
    const response = await zendeskFetch<{
      users: ZendeskUser[];
      next_page: string | null;
      count: number;
    }>(url, accessToken);

    results.push(...response.users);
    url = response.next_page;
  }

  return results;
}
