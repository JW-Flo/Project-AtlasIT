import type { PagerDutyUser, PagerDutyTeam } from "./types.js";

const API_BASE = "https://api.pagerduty.com";

interface PaginatedResponse<T> {
  data: T[];
  limit: number;
  offset: number;
  total: number;
  more: boolean;
}

async function pagerDutyFetch<T>(
  url: string,
  apiKey: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Token token=${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.pagerduty+json;version=2",
  };

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`PagerDuty API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function paginateAll<T>(
  initialUrl: string,
  apiKey: string,
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const separator = initialUrl.includes("?") ? "&" : "?";
    const url = `${initialUrl}${separator}limit=${limit}&offset=${offset}`;
    const response = await pagerDutyFetch<PaginatedResponse<T>>(url, apiKey);
    results.push(...response.data);

    if (!response.more) break;
    offset += limit;
  }

  return results;
}

// -- Users --

export async function listUsers(apiKey: string): Promise<PagerDutyUser[]> {
  const url = `${API_BASE}/users`;
  return paginateAll<PagerDutyUser>(url, apiKey);
}

export async function getUser(
  userId: string,
  apiKey: string,
): Promise<PagerDutyUser> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
  const response = await pagerDutyFetch<{ user: PagerDutyUser }>(url, apiKey);
  return response.user;
}

export async function createUser(
  apiKey: string,
  data: {
    name: string;
    email: string;
    role?: string;
  },
): Promise<PagerDutyUser> {
  const url = `${API_BASE}/users`;
  const response = await pagerDutyFetch<{ user: PagerDutyUser }>(
    url,
    apiKey,
    "POST",
    { user: data },
  );
  return response.user;
}

export async function updateUser(
  userId: string,
  apiKey: string,
  data: Partial<PagerDutyUser>,
): Promise<PagerDutyUser> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
  const response = await pagerDutyFetch<{ user: PagerDutyUser }>(
    url,
    apiKey,
    "PUT",
    { user: data },
  );
  return response.user;
}

export async function deleteUser(
  userId: string,
  apiKey: string,
): Promise<void> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
  await pagerDutyFetch<void>(url, apiKey, "DELETE");
}

// -- Teams --

export async function listTeams(apiKey: string): Promise<PagerDutyTeam[]> {
  const url = `${API_BASE}/teams`;
  return paginateAll<PagerDutyTeam>(url, apiKey);
}

export async function getTeam(
  teamId: string,
  apiKey: string,
): Promise<PagerDutyTeam> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}`;
  const response = await pagerDutyFetch<{ team: PagerDutyTeam }>(url, apiKey);
  return response.team;
}

export async function getTeamMembers(
  teamId: string,
  apiKey: string,
): Promise<PagerDutyUser[]> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}/members`;
  return paginateAll<PagerDutyUser>(url, apiKey);
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  apiKey: string,
): Promise<void> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}/members`;
  await pagerDutyFetch<void>(url, apiKey, "POST", {
    members: [{ id: userId, type: "user_reference" }],
  });
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
  apiKey: string,
): Promise<void> {
  const url = `${API_BASE}/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`;
  await pagerDutyFetch<void>(url, apiKey, "DELETE");
}
