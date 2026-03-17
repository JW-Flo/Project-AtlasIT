import type {
  DropboxUser,
  DropboxGroup,
  DropboxListMembersResponse,
  DropboxListGroupsResponse,
} from "./types.js";

const API_BASE = "https://api.dropboxapi.com/2";

async function dropboxFetch<T>(
  url: string,
  accessToken: string,
  method: string = "POST",
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
    throw new Error(`Dropbox API error (${response.status}): ${errorBody}`);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T;
  return data;
}

// -- Team members --

export async function listTeamMembers(
  accessToken: string,
  cursor?: string,
): Promise<DropboxListMembersResponse> {
  const url = `${API_BASE}/team/members/list_v2`;
  const body = {
    limit: 100,
    ...(cursor ? { cursor } : {}),
  };

  return dropboxFetch<DropboxListMembersResponse>(
    url,
    accessToken,
    "POST",
    body,
  );
}

export async function continueListingTeamMembers(
  accessToken: string,
  cursor: string,
): Promise<DropboxListMembersResponse> {
  const url = `${API_BASE}/team/members/list/continue_v2`;
  const body = { cursor };

  return dropboxFetch<DropboxListMembersResponse>(
    url,
    accessToken,
    "POST",
    body,
  );
}

// -- Team groups --

export async function listTeamGroups(
  accessToken: string,
  cursor?: string,
): Promise<DropboxListGroupsResponse> {
  const url = `${API_BASE}/team/groups/list`;
  const body = {
    limit: 100,
    ...(cursor ? { cursor } : {}),
  };

  return dropboxFetch<DropboxListGroupsResponse>(
    url,
    accessToken,
    "POST",
    body,
  );
}

export async function continueListingTeamGroups(
  accessToken: string,
  cursor: string,
): Promise<DropboxListGroupsResponse> {
  const url = `${API_BASE}/team/groups/list/continue`;
  const body = { cursor };

  return dropboxFetch<DropboxListGroupsResponse>(
    url,
    accessToken,
    "POST",
    body,
  );
}

export async function getGroupMembers(
  accessToken: string,
  groupId: string,
): Promise<DropboxGroupMember[]> {
  const url = `${API_BASE}/team/groups/members/list`;
  const body = {
    group_id: groupId,
    limit: 100,
  };

  // This endpoint returns { members: [...] }
  const response = await dropboxFetch<{ members: DropboxGroupMember[] }>(
    url,
    accessToken,
    "POST",
    body,
  );

  return response.members || [];
}
