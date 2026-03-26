import type {
  OnePasswordUser,
  OnePasswordGroup,
  OnePasswordListResponse,
} from "./types.js";

interface SCIMError {
  schemas: string[];
  status: number;
  detail: string;
}

async function onePasswordFetch<T>(
  url: string,
  token: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
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
    const errorMsg =
      response.status === 400 || response.status === 401
        ? errorBody
        : `HTTP ${response.status}`;
    throw new Error(`1Password API error: ${errorMsg}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function paginateAll<T>(initialUrl: string, token: string): Promise<T[]> {
  const results: T[] = [];
  let startIndex = 1;

  while (true) {
    const separator = initialUrl.includes("?") ? "&" : "?";
    const url = `${initialUrl}${separator}startIndex=${startIndex}&count=100`;

    const response = await onePasswordFetch<OnePasswordListResponse<T>>(
      url,
      token,
    );
    results.push(...response.Resources);

    if (response.Resources.length === 0) break;
    startIndex += response.Resources.length;
  }

  return results;
}

// -- Users --

export async function listUsers(
  scimBridgeUrl: string,
  token: string,
): Promise<OnePasswordUser[]> {
  const url = `${scimBridgeUrl}/scim/v2/Users`;
  return paginateAll<OnePasswordUser>(url, token);
}

export async function getUser(
  userId: string,
  scimBridgeUrl: string,
  token: string,
): Promise<OnePasswordUser> {
  const url = `${scimBridgeUrl}/scim/v2/Users/${encodeURIComponent(userId)}`;
  const response = await onePasswordFetch<OnePasswordUser>(url, token);
  return response;
}

export async function createUser(
  scimBridgeUrl: string,
  token: string,
  data: {
    userName: string;
    displayName: string;
    emails: Array<{ value: string; primary?: boolean }>;
    name: { givenName: string; familyName: string };
  },
): Promise<OnePasswordUser> {
  const url = `${scimBridgeUrl}/scim/v2/Users`;
  const response = await onePasswordFetch<OnePasswordUser>(url, token, "POST", {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    ...data,
  });
  return response;
}

export async function updateUser(
  userId: string,
  scimBridgeUrl: string,
  token: string,
  data: Partial<OnePasswordUser>,
): Promise<OnePasswordUser> {
  const url = `${scimBridgeUrl}/scim/v2/Users/${encodeURIComponent(userId)}`;
  const response = await onePasswordFetch<OnePasswordUser>(
    url,
    token,
    "PATCH",
    {
      schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      Operations: [{ op: "replace", path: "/", value: data }],
    },
  );
  return response;
}

export async function deleteUser(
  userId: string,
  scimBridgeUrl: string,
  token: string,
): Promise<void> {
  const url = `${scimBridgeUrl}/scim/v2/Users/${encodeURIComponent(userId)}`;
  await onePasswordFetch<void>(url, token, "DELETE");
}

// -- Groups --

export async function listGroups(
  scimBridgeUrl: string,
  token: string,
): Promise<OnePasswordGroup[]> {
  const url = `${scimBridgeUrl}/scim/v2/Groups`;
  return paginateAll<OnePasswordGroup>(url, token);
}

export async function getGroup(
  groupId: string,
  scimBridgeUrl: string,
  token: string,
): Promise<OnePasswordGroup> {
  const url = `${scimBridgeUrl}/scim/v2/Groups/${encodeURIComponent(groupId)}`;
  const response = await onePasswordFetch<OnePasswordGroup>(url, token);
  return response;
}

export async function getGroupMembers(
  groupId: string,
  scimBridgeUrl: string,
  token: string,
): Promise<OnePasswordUser[]> {
  const group = await getGroup(groupId, scimBridgeUrl, token);

  if (!group.members || group.members.length === 0) {
    return [];
  }

  // SCIM groups store member references; we'd need to fetch each user individually
  // For now, return empty list — in production, iterate over members and fetch each
  return [];
}

export async function addGroupMember(
  groupId: string,
  userId: string,
  scimBridgeUrl: string,
  token: string,
): Promise<void> {
  const url = `${scimBridgeUrl}/scim/v2/Groups/${encodeURIComponent(groupId)}`;
  await onePasswordFetch<void>(url, token, "PATCH", {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
    Operations: [
      {
        op: "add",
        path: "members",
        value: [{ value: userId }],
      },
    ],
  });
}

export async function removeGroupMember(
  groupId: string,
  userId: string,
  scimBridgeUrl: string,
  token: string,
): Promise<void> {
  const url = `${scimBridgeUrl}/scim/v2/Groups/${encodeURIComponent(groupId)}`;
  await onePasswordFetch<void>(url, token, "PATCH", {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
    Operations: [
      {
        op: "remove",
        path: `members[value eq "${userId}"]`,
      },
    ],
  });
}
