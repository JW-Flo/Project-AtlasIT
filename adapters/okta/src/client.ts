import type { OktaUser, OktaGroup } from "./types.js";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const remaining = parseInt(headers.get("X-Rate-Limit-Remaining") ?? "60", 10);
  const resetAt = parseInt(headers.get("X-Rate-Limit-Reset") ?? "0", 10) * 1000;
  return { remaining, resetAt };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

function parseNextLink(headers: Headers): string | null {
  const linkHeader = headers.get("Link");
  if (!linkHeader) return null;

  const links = linkHeader.split(",");
  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

async function oktaFetch<T>(
  url: string,
  apiToken: string,
): Promise<{ data: T; nextUrl: string | null }> {
  const response = await fetch(url, {
    headers: {
      Authorization: `SSWS ${apiToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Okta API error (${response.status}): ${body}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  const data = (await response.json()) as T;
  const nextUrl = parseNextLink(response.headers);

  return { data, nextUrl };
}

async function paginateAll<T>(
  initialUrl: string,
  apiToken: string,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = initialUrl;

  while (url) {
    const response: { data: T[]; nextUrl: string | null } = await oktaFetch<
      T[]
    >(url, apiToken);
    results.push(...response.data);
    url = response.nextUrl;
  }

  return results;
}

export async function listUsers(
  orgUrl: string,
  apiToken: string,
): Promise<OktaUser[]> {
  const url = `${orgUrl}/api/v1/users?limit=200`;
  return paginateAll<OktaUser>(url, apiToken);
}

export async function listGroups(
  orgUrl: string,
  apiToken: string,
): Promise<OktaGroup[]> {
  const url = `${orgUrl}/api/v1/groups?limit=200`;
  return paginateAll<OktaGroup>(url, apiToken);
}

export async function listGroupMembers(
  orgUrl: string,
  apiToken: string,
  groupId: string,
): Promise<OktaUser[]> {
  const url = `${orgUrl}/api/v1/groups/${encodeURIComponent(groupId)}/users?limit=200`;
  return paginateAll<OktaUser>(url, apiToken);
}

export async function getUser(
  orgUrl: string,
  apiToken: string,
  userId: string,
): Promise<OktaUser> {
  const url = `${orgUrl}/api/v1/users/${encodeURIComponent(userId)}`;
  const { data } = await oktaFetch<OktaUser>(url, apiToken);
  return data;
}
