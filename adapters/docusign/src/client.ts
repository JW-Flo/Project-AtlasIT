import type {
  DocuSignUser,
  DocuSignGroup,
  DocuSignUsersResponse,
  DocuSignGroupsResponse,
} from "./types.js";

interface DocuSignConfig {
  accountId: string;
  baseUrl: string;
}

function buildApiUrl(config: DocuSignConfig, path: string): string {
  return `${config.baseUrl}/restapi/v2.1/accounts/${config.accountId}${path}`;
}

async function docusignFetch<T>(
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

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`DocuSign API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return { data: undefined as T, nextUrl: null };
  }

  const data = (await response.json()) as T;
  const nextUrl = (data as Record<string, unknown>)["nextUri"] || null;

  return { data, nextUrl: nextUrl as string | null };
}

async function paginateAll<T>(
  initialUrl: string,
  accessToken: string,
  resultKey: "users" | "groups",
): Promise<T[]> {
  const results: T[] = [];
  let currentUrl: string | null = initialUrl;

  while (currentUrl) {
    const response: {
      data: DocuSignUsersResponse | DocuSignGroupsResponse;
      nextUrl: string | null;
    } = await docusignFetch<DocuSignUsersResponse | DocuSignGroupsResponse>(
      currentUrl,
      accessToken,
    );
    const data = response.data as unknown as Record<string, unknown>;
    const items = (data[resultKey] as T[]) || [];
    results.push(...items);
    currentUrl = response.nextUrl;
  }

  return results;
}

// -- Users --

export async function listUsers(
  config: DocuSignConfig,
  accessToken: string,
): Promise<DocuSignUser[]> {
  const url = buildApiUrl(config, "/users?count=100");
  return paginateAll<DocuSignUser>(url, accessToken, "users");
}

export async function getUser(
  config: DocuSignConfig,
  userId: string,
  accessToken: string,
): Promise<DocuSignUser> {
  const url = buildApiUrl(config, `/users/${userId}`);
  const { data } = await docusignFetch<DocuSignUser>(url, accessToken);
  return data;
}

// -- Groups --

export async function listGroups(
  config: DocuSignConfig,
  accessToken: string,
): Promise<DocuSignGroup[]> {
  const url = buildApiUrl(config, "/groups?count=100");
  return paginateAll<DocuSignGroup>(url, accessToken, "groups");
}

export async function getGroup(
  config: DocuSignConfig,
  groupId: string,
  accessToken: string,
): Promise<DocuSignGroup> {
  const url = buildApiUrl(config, `/groups/${groupId}`);
  const { data } = await docusignFetch<DocuSignGroup>(url, accessToken);
  return data;
}

export async function getGroupMembers(
  config: DocuSignConfig,
  groupId: string,
  accessToken: string,
): Promise<DocuSignUser[]> {
  const url = buildApiUrl(config, `/groups/${groupId}/users?count=100`);
  return paginateAll<DocuSignUser>(url, accessToken, "users");
}

export async function addGroupMember(
  config: DocuSignConfig,
  groupId: string,
  userId: string,
  accessToken: string,
): Promise<{ userId: string }> {
  const url = buildApiUrl(config, `/groups/${groupId}/users`);
  const { data } = await docusignFetch<{ userId: string }>(
    url,
    accessToken,
    "POST",
    {
      userId,
    },
  );
  return data;
}

export async function removeGroupMember(
  config: DocuSignConfig,
  groupId: string,
  userId: string,
  accessToken: string,
): Promise<void> {
  const url = buildApiUrl(config, `/groups/${groupId}/users/${userId}`);
  await docusignFetch<void>(url, accessToken, "DELETE");
}
