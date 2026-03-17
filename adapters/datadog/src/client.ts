import type { DatadogUser, DatadogGroup } from "./types.js";

interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    page?: {
      cursor?: string;
      total_count?: number;
    };
  };
}

async function datadogFetch<T>(
  url: string,
  apiKey: string,
  appKey: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "DD-API-KEY": apiKey,
    "DD-APPLICATION-KEY": appKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Datadog API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function paginateAll<T>(
  initialUrl: string,
  apiKey: string,
  appKey: string,
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | undefined;

  while (true) {
    const separator = initialUrl.includes("?") ? "&" : "?";
    const url = cursor
      ? `${initialUrl}${separator}page[cursor]=${encodeURIComponent(cursor)}`
      : initialUrl;

    const response = await datadogFetch<PaginatedResponse<T>>(
      url,
      apiKey,
      appKey,
    );
    results.push(...response.data);

    cursor = response.meta?.page?.cursor;
    if (!cursor) break;
  }

  return results;
}

// -- Users --

export async function listUsers(
  apiKey: string,
  appKey: string,
): Promise<DatadogUser[]> {
  const url = "https://api.datadoghq.com/api/v2/users?page[size]=100";
  return paginateAll<DatadogUser>(url, apiKey, appKey);
}

export async function getUser(
  userId: string,
  apiKey: string,
  appKey: string,
): Promise<DatadogUser> {
  const url = `https://api.datadoghq.com/api/v2/users/${encodeURIComponent(userId)}`;
  const response = await datadogFetch<{ data: DatadogUser }>(
    url,
    apiKey,
    appKey,
  );
  return response.data;
}

export async function createUser(
  apiKey: string,
  appKey: string,
  data: {
    name: string;
    email: string;
  },
): Promise<DatadogUser> {
  const url = "https://api.datadoghq.com/api/v2/users";
  const response = await datadogFetch<{ data: DatadogUser }>(
    url,
    apiKey,
    appKey,
    "POST",
    { data: { type: "users", attributes: data } },
  );
  return response.data;
}

export async function updateUser(
  userId: string,
  apiKey: string,
  appKey: string,
  data: Partial<DatadogUser>,
): Promise<DatadogUser> {
  const url = `https://api.datadoghq.com/api/v2/users/${encodeURIComponent(userId)}`;
  const response = await datadogFetch<{ data: DatadogUser }>(
    url,
    apiKey,
    appKey,
    "PATCH",
    { data },
  );
  return response.data;
}

export async function disableUser(
  userId: string,
  apiKey: string,
  appKey: string,
): Promise<void> {
  const url = `https://api.datadoghq.com/api/v2/users/${encodeURIComponent(userId)}`;
  await datadogFetch<void>(url, apiKey, appKey, "DELETE");
}

// -- Groups/Teams --

export async function listGroups(
  apiKey: string,
  appKey: string,
): Promise<DatadogGroup[]> {
  const url = "https://api.datadoghq.com/api/v2/groups?page[size]=100";
  return paginateAll<DatadogGroup>(url, apiKey, appKey);
}

export async function getGroup(
  groupId: string,
  apiKey: string,
  appKey: string,
): Promise<DatadogGroup> {
  const url = `https://api.datadoghq.com/api/v2/groups/${encodeURIComponent(groupId)}`;
  const response = await datadogFetch<{ data: DatadogGroup }>(
    url,
    apiKey,
    appKey,
  );
  return response.data;
}

export async function getGroupMembers(
  groupId: string,
  apiKey: string,
  appKey: string,
): Promise<DatadogUser[]> {
  const url = `https://api.datadoghq.com/api/v2/groups/${encodeURIComponent(groupId)}/members?page[size]=100`;
  return paginateAll<DatadogUser>(url, apiKey, appKey);
}

export async function addGroupMember(
  groupId: string,
  userId: string,
  apiKey: string,
  appKey: string,
): Promise<void> {
  const url = `https://api.datadoghq.com/api/v2/groups/${encodeURIComponent(groupId)}/members`;
  await datadogFetch<void>(url, apiKey, appKey, "POST", {
    data: { id: userId, type: "users" },
  });
}

export async function removeGroupMember(
  groupId: string,
  userId: string,
  apiKey: string,
  appKey: string,
): Promise<void> {
  const url = `https://api.datadoghq.com/api/v2/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`;
  await datadogFetch<void>(url, apiKey, appKey, "DELETE");
}
