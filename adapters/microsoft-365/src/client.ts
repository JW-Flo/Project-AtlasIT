import type { GraphUser, GraphGroup, GraphMember } from "./types.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

interface GraphPagedResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

async function graphFetch<T>(
  url: string,
  accessToken: string,
): Promise<GraphPagedResponse<T>> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Microsoft Graph API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<GraphPagedResponse<T>>;
}

async function paginateAll<T>(
  initialUrl: string,
  accessToken: string,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = initialUrl;

  while (url) {
    const page: GraphPagedResponse<T> = await graphFetch<T>(url, accessToken);
    results.push(...page.value);
    url = page["@odata.nextLink"] ?? null;
  }

  return results;
}

export async function listUsers(accessToken: string): Promise<GraphUser[]> {
  const select = [
    "id",
    "userPrincipalName",
    "displayName",
    "givenName",
    "surname",
    "mail",
    "department",
    "jobTitle",
    "accountEnabled",
  ].join(",");

  const url = `${GRAPH_BASE}/users?$select=${select}&$top=999`;
  return paginateAll<GraphUser>(url, accessToken);
}

export async function getUser(
  accessToken: string,
  userId: string,
): Promise<GraphUser> {
  const url = `${GRAPH_BASE}/users/${encodeURIComponent(userId)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Microsoft Graph API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<GraphUser>;
}

export async function createUser(
  accessToken: string,
  user: {
    displayName: string;
    mailNickname: string;
    userPrincipalName: string;
    accountEnabled: boolean;
    passwordProfile: {
      password: string;
      forceChangePasswordNextSignIn: boolean;
    };
  },
): Promise<GraphUser> {
  const response = await fetch(`${GRAPH_BASE}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Microsoft Graph create user failed (${response.status}): ${body}`,
    );
  }

  return response.json() as Promise<GraphUser>;
}

export async function updateUser(
  accessToken: string,
  userId: string,
  updates: Partial<
    Pick<
      GraphUser,
      | "displayName"
      | "givenName"
      | "surname"
      | "department"
      | "jobTitle"
      | "accountEnabled"
    >
  >,
): Promise<void> {
  const response = await fetch(
    `${GRAPH_BASE}/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Microsoft Graph update user failed (${response.status}): ${body}`,
    );
  }
}

export async function deleteUser(
  accessToken: string,
  userId: string,
): Promise<void> {
  const response = await fetch(
    `${GRAPH_BASE}/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Microsoft Graph delete user failed (${response.status}): ${body}`,
    );
  }
}

export async function listGroups(accessToken: string): Promise<GraphGroup[]> {
  const select = [
    "id",
    "displayName",
    "description",
    "mail",
    "groupTypes",
  ].join(",");
  const url = `${GRAPH_BASE}/groups?$select=${select}&$top=999`;
  return paginateAll<GraphGroup>(url, accessToken);
}

export async function getGroupMembers(
  accessToken: string,
  groupId: string,
): Promise<GraphMember[]> {
  const url = `${GRAPH_BASE}/groups/${encodeURIComponent(groupId)}/members?$top=999`;
  return paginateAll<GraphMember>(url, accessToken);
}
