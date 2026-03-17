import type { CanvaUser, CanvaTeamMembersResponse } from "./types.js";

const API_BASE = "https://api.canva.com/rest/v1";

async function canvaFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Canva API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T;
  return data;
}

// -- Team members --

export async function listTeamMembers(
  accessToken: string,
  teamId: string,
  cursor?: string,
): Promise<CanvaTeamMembersResponse> {
  const url = new URL(
    `${API_BASE}/teams/${encodeURIComponent(teamId)}/members`,
  );
  url.searchParams.set("limit", "100");
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  return canvaFetch<CanvaTeamMembersResponse>(url.toString(), accessToken);
}
