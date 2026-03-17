import type {
  GitHubUser,
  GitHubTeam,
  GitHubMembership,
  GitHubTeamMembership,
} from "./types.js";

const API_BASE = "https://api.github.com";

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

async function githubFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ data: T; nextUrl: string | null }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
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
    throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return { data: undefined as T, nextUrl: null };
  }

  const data = (await response.json()) as T;
  const nextUrl = parseNextLink(response.headers);

  return { data, nextUrl };
}

async function paginateAll<T>(
  initialUrl: string,
  accessToken: string,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = initialUrl;

  while (url) {
    const response: { data: T[]; nextUrl: string | null } = await githubFetch<
      T[]
    >(url, accessToken);
    results.push(...response.data);
    url = response.nextUrl;
  }

  return results;
}

// -- Org members --

export async function listOrgMembers(
  org: string,
  accessToken: string,
): Promise<GitHubUser[]> {
  const url = `${API_BASE}/orgs/${encodeURIComponent(org)}/members?per_page=100`;
  return paginateAll<GitHubUser>(url, accessToken);
}

export async function getUser(
  username: string,
  accessToken: string,
): Promise<GitHubUser> {
  const url = `${API_BASE}/users/${encodeURIComponent(username)}`;
  const { data } = await githubFetch<GitHubUser>(url, accessToken);
  return data;
}

export async function addOrgMember(
  org: string,
  username: string,
  accessToken: string,
  role: "admin" | "member" = "member",
): Promise<GitHubMembership> {
  const url = `${API_BASE}/orgs/${encodeURIComponent(org)}/memberships/${encodeURIComponent(username)}`;
  const { data } = await githubFetch<GitHubMembership>(
    url,
    accessToken,
    "PUT",
    { role },
  );
  return data;
}

export async function removeOrgMember(
  org: string,
  username: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/orgs/${encodeURIComponent(org)}/members/${encodeURIComponent(username)}`;
  await githubFetch<void>(url, accessToken, "DELETE");
}

// -- Teams --

export async function listTeams(
  org: string,
  accessToken: string,
): Promise<GitHubTeam[]> {
  const url = `${API_BASE}/orgs/${encodeURIComponent(org)}/teams?per_page=100`;
  return paginateAll<GitHubTeam>(url, accessToken);
}

export async function getTeamMembers(
  org: string,
  teamSlug: string,
  accessToken: string,
): Promise<GitHubUser[]> {
  const url = `${API_BASE}/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/members?per_page=100`;
  return paginateAll<GitHubUser>(url, accessToken);
}

export async function addTeamMember(
  org: string,
  teamSlug: string,
  username: string,
  accessToken: string,
  role: "member" | "maintainer" = "member",
): Promise<GitHubTeamMembership> {
  const url = `${API_BASE}/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/memberships/${encodeURIComponent(username)}`;
  const { data } = await githubFetch<GitHubTeamMembership>(
    url,
    accessToken,
    "PUT",
    { role },
  );
  return data;
}

export async function removeTeamMember(
  org: string,
  teamSlug: string,
  username: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/memberships/${encodeURIComponent(username)}`;
  await githubFetch<void>(url, accessToken, "DELETE");
}
