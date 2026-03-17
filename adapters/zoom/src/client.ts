import type {
  ZoomUser,
  ZoomGroup,
  ZoomGroupMember,
  ZoomListResponse,
} from "./types.js";

const API_BASE = "https://api.zoom.us/v2";

async function zoomFetch<T>(
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
    throw new Error(`Zoom API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T;
  return data;
}

async function paginateAll<T>(
  initialUrl: string,
  accessToken: string,
  pageSize: number = 300,
): Promise<T[]> {
  const results: T[] = [];
  let nextPageToken: string | undefined;

  while (true) {
    const url = nextPageToken
      ? `${initialUrl}&next_page_token=${encodeURIComponent(nextPageToken)}`
      : `${initialUrl}&page_size=${pageSize}`;

    const response = await zoomFetch<
      ZoomListResponse<T> & { [key: string]: unknown }
    >(url, accessToken);

    const items =
      (response as unknown as { users?: T[]; members?: T[] }).users ||
      (response as unknown as { members?: T[] }).members ||
      [];
    results.push(...(items as T[]));

    nextPageToken = response.next_page_token;
    if (!nextPageToken) break;
  }

  return results;
}

// -- Users --

export async function listUsers(
  accessToken: string,
  status: string = "active",
): Promise<ZoomUser[]> {
  const url = `${API_BASE}/users?status=${status}`;
  return paginateAll<ZoomUser>(url, accessToken);
}

export async function getUser(
  userId: string,
  accessToken: string,
): Promise<ZoomUser> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
  return zoomFetch<ZoomUser>(url, accessToken);
}

export async function createUser(
  accessToken: string,
  email: string,
  firstName: string,
  lastName: string,
  userType: number = 1,
): Promise<ZoomUser> {
  const url = `${API_BASE}/users`;
  return zoomFetch<ZoomUser>(url, accessToken, "POST", {
    action: "create",
    user_info: {
      email,
      first_name: firstName,
      last_name: lastName,
      type: userType,
    },
  });
}

export async function deleteUser(
  userId: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}?action=delete`;
  await zoomFetch<void>(url, accessToken, "DELETE");
}

// -- Groups --

export async function listGroups(accessToken: string): Promise<ZoomGroup[]> {
  const url = `${API_BASE}/groups`;
  return paginateAll<ZoomGroup>(url, accessToken);
}

export async function getGroup(
  groupId: string,
  accessToken: string,
): Promise<ZoomGroup> {
  const url = `${API_BASE}/groups/${encodeURIComponent(groupId)}`;
  return zoomFetch<ZoomGroup>(url, accessToken);
}

export async function listGroupMembers(
  groupId: string,
  accessToken: string,
): Promise<ZoomGroupMember[]> {
  const url = `${API_BASE}/groups/${encodeURIComponent(groupId)}/members`;
  return paginateAll<ZoomGroupMember>(url, accessToken);
}

export async function addGroupMember(
  groupId: string,
  memberId: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/groups/${encodeURIComponent(groupId)}/members`;
  await zoomFetch<void>(url, accessToken, "POST", {
    member_ids: [memberId],
  });
}

export async function removeGroupMember(
  groupId: string,
  memberId: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`;
  await zoomFetch<void>(url, accessToken, "DELETE");
}
