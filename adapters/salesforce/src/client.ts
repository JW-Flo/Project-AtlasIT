import type {
  SalesforceUser,
  SalesforceGroup,
  SalesforceGroupMember,
  SalesforceQueryResponse,
} from "./types.js";

interface SalesforceConfig {
  instanceUrl: string;
}

function buildApiUrl(config: SalesforceConfig, path: string): string {
  return `${config.instanceUrl}/services/data/v60.0${path}`;
}

async function salesforceFetch<T>(
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
    throw new Error(`Salesforce API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return { data: undefined as T, nextUrl: null };
  }

  const data = (await response.json()) as T;
  const nextUrl = (data as Record<string, unknown>)["nextRecordsUrl"] || null;

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
      data: SalesforceQueryResponse<T>;
      nextUrl: string | null;
    } = await salesforceFetch<SalesforceQueryResponse<T>>(url, accessToken);
    results.push(...response.data.records);
    url = response.nextUrl;
  }

  return results;
}

// -- Users --

export async function listUsers(
  config: SalesforceConfig,
  accessToken: string,
): Promise<SalesforceUser[]> {
  const query =
    "SELECT Id, Username, Email, Name, FirstName, LastName, Title, Department, IsActive FROM User WHERE IsActive = true";
  const encodedQuery = encodeURIComponent(query);
  const url = buildApiUrl(config, `/query?q=${encodedQuery}`);
  return paginateAll<SalesforceUser>(url, accessToken);
}

export async function getUser(
  config: SalesforceConfig,
  userId: string,
  accessToken: string,
): Promise<SalesforceUser> {
  const url = buildApiUrl(config, `/sobjects/User/${userId}`);
  const { data } = await salesforceFetch<SalesforceUser>(url, accessToken);
  return data;
}

// -- Groups --

export async function listGroups(
  config: SalesforceConfig,
  accessToken: string,
): Promise<SalesforceGroup[]> {
  const query =
    "SELECT Id, Name, Type, Description FROM Group WHERE Type IN ('Regular', 'Queue')";
  const encodedQuery = encodeURIComponent(query);
  const url = buildApiUrl(config, `/query?q=${encodedQuery}`);
  return paginateAll<SalesforceGroup>(url, accessToken);
}

export async function getGroup(
  config: SalesforceConfig,
  groupId: string,
  accessToken: string,
): Promise<SalesforceGroup> {
  const url = buildApiUrl(config, `/sobjects/Group/${groupId}`);
  const { data } = await salesforceFetch<SalesforceGroup>(url, accessToken);
  return data;
}

export async function getGroupMembers(
  config: SalesforceConfig,
  groupId: string,
  accessToken: string,
): Promise<SalesforceGroupMember[]> {
  const query = `SELECT Id, GroupId, UserOrGroupId FROM GroupMember WHERE GroupId = '${groupId}'`;
  const encodedQuery = encodeURIComponent(query);
  const url = buildApiUrl(config, `/query?q=${encodedQuery}`);
  return paginateAll<SalesforceGroupMember>(url, accessToken);
}

export async function addGroupMember(
  config: SalesforceConfig,
  groupId: string,
  userId: string,
  accessToken: string,
): Promise<{ id: string }> {
  const url = buildApiUrl(config, "/sobjects/GroupMember");
  const { data } = await salesforceFetch<{ id: string }>(
    url,
    accessToken,
    "POST",
    {
      GroupId: groupId,
      UserOrGroupId: userId,
    },
  );
  return data;
}

export async function removeGroupMember(
  config: SalesforceConfig,
  memberId: string,
  accessToken: string,
): Promise<void> {
  const url = buildApiUrl(config, `/sobjects/GroupMember/${memberId}`);
  await salesforceFetch<void>(url, accessToken, "DELETE");
}
