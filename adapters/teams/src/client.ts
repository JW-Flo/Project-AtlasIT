import type {
  GraphUser,
  GraphTeam,
  GraphDirectoryObject,
  GraphPaginatedResponse,
} from "./types.js";

const API_BASE = "https://graph.microsoft.com/v1.0";

function parseRateLimit(headers: Headers): {
  remaining: number;
  resetMs: number;
} {
  const remaining = parseInt(
    headers.get("RateLimit-Remaining") ??
      headers.get("x-ratelimit-remaining") ??
      "100",
    10,
  );
  const retryAfter = parseInt(headers.get("Retry-After") ?? "0", 10);
  return { remaining, resetMs: retryAfter * 1000 };
}

async function waitForRateLimit(rateLimit: {
  remaining: number;
  resetMs: number;
}): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const delay = Math.max(rateLimit.resetMs, 1000);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function graphFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ data: T; nextUrl: string | null }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (response.status === 429) {
    const rateLimit = parseRateLimit(response.headers);
    await waitForRateLimit({
      remaining: 0,
      resetMs: rateLimit.resetMs || 5000,
    });
    return graphFetch<T>(url, accessToken, method, body);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Graph API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return { data: undefined as T, nextUrl: null };
  }

  const data = (await response.json()) as T;
  const nextUrl = (data as Record<string, unknown>)["@odata.nextLink"] || null;

  return { data, nextUrl: nextUrl as string | null };
}

async function paginateAll<T>(
  initialUrl: string,
  accessToken: string,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = initialUrl;

  while (url) {
    const response: {
      data: GraphPaginatedResponse<T>;
      nextUrl: string | null;
    } = await graphFetch<GraphPaginatedResponse<T>>(url, accessToken);
    results.push(...response.data.value);
    url = response.nextUrl;
  }

  return results;
}

// -- Users --

export async function listUsers(accessToken: string): Promise<GraphUser[]> {
  const url = `${API_BASE}/users?$filter=accountEnabled eq true&$select=id,userPrincipalName,displayName,mail,givenName,surname,jobTitle,department`;
  return paginateAll<GraphUser>(url, accessToken);
}

export async function getUser(
  userId: string,
  accessToken: string,
): Promise<GraphUser> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
  const { data } = await graphFetch<GraphUser>(url, accessToken);
  return data;
}

// -- Teams/Groups --

export async function listTeams(accessToken: string): Promise<GraphTeam[]> {
  const url = `${API_BASE}/teams?$select=id,displayName,description`;
  return paginateAll<GraphTeam>(url, accessToken);
}

export async function getTeam(
  teamId: string,
  accessToken: string,
): Promise<GraphTeam> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}`;
  const { data } = await graphFetch<GraphTeam>(url, accessToken);
  return data;
}

export async function getTeamMembers(
  teamId: string,
  accessToken: string,
): Promise<GraphDirectoryObject[]> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}/members?$select=id,displayName,mail`;
  return paginateAll<GraphDirectoryObject>(url, accessToken);
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}/members`;
  await graphFetch<void>(url, accessToken, "POST", {
    "@odata.type": "#microsoft.graph.aadUserConversationMember",
    user: {
      "@odata.id": `https://graph.microsoft.com/v1.0/users/${userId}`,
    },
  });
}

export async function removeTeamMember(
  teamId: string,
  membershipId: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(membershipId)}`;
  await graphFetch<void>(url, accessToken, "DELETE");
}
