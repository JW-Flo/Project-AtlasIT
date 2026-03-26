import type {
  AzureUser,
  AzureGroup,
  AzureGroupMember,
  AzureSubscription,
  RoleAssignment,
  GraphPagedResponse,
  ArmPagedResponse,
} from "./types.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const ARM_BASE = "https://management.azure.com";
const ARM_API_VERSION_RBAC = "2022-04-01";
const ARM_API_VERSION_SUBS = "2022-09-01";

// ---------------------------------------------------------------------------
// Generic fetch helpers
// ---------------------------------------------------------------------------

async function graphFetch<T>(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Graph API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

async function armFetch<T>(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`ARM API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Graph API pagination
// ---------------------------------------------------------------------------

async function graphPaginateAll<T>(
  initialUrl: string,
  accessToken: string,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = initialUrl;

  while (url) {
    const page: GraphPagedResponse<T> = await graphFetch<GraphPagedResponse<T>>(
      url,
      accessToken,
    );
    results.push(...page.value);
    url = page["@odata.nextLink"];
  }

  return results;
}

async function armPaginateAll<T>(
  initialUrl: string,
  accessToken: string,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = initialUrl;

  while (url) {
    const page: ArmPagedResponse<T> = await armFetch<ArmPagedResponse<T>>(
      url,
      accessToken,
    );
    results.push(...page.value);
    url = page.nextLink;
  }

  return results;
}

// ---------------------------------------------------------------------------
// Entra ID Users (Microsoft Graph)
// ---------------------------------------------------------------------------

export async function listUsers(accessToken: string): Promise<AzureUser[]> {
  const fields = [
    "id",
    "displayName",
    "userPrincipalName",
    "mail",
    "givenName",
    "surname",
    "jobTitle",
    "department",
    "accountEnabled",
    "officeLocation",
    "mobilePhone",
  ].join(",");

  return graphPaginateAll<AzureUser>(
    `${GRAPH_BASE}/users?$select=${fields}&$top=999`,
    accessToken,
  );
}

export async function getUser(
  accessToken: string,
  userId: string,
): Promise<AzureUser> {
  return graphFetch<AzureUser>(
    `${GRAPH_BASE}/users/${encodeURIComponent(userId)}`,
    accessToken,
  );
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
): Promise<AzureUser> {
  return graphFetch<AzureUser>(`${GRAPH_BASE}/users`, accessToken, {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export async function updateUser(
  accessToken: string,
  userId: string,
  updates: Partial<
    Pick<
      AzureUser,
      "displayName" | "jobTitle" | "department" | "accountEnabled"
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
    throw new Error(`Graph API PATCH user error (${response.status}): ${body}`);
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
      `Graph API DELETE user error (${response.status}): ${body}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Entra ID Groups (Microsoft Graph)
// ---------------------------------------------------------------------------

export async function listGroups(accessToken: string): Promise<AzureGroup[]> {
  return graphPaginateAll<AzureGroup>(
    `${GRAPH_BASE}/groups?$select=id,displayName,description,mailEnabled,securityEnabled,groupTypes&$top=999`,
    accessToken,
  );
}

export async function getGroupMembers(
  accessToken: string,
  groupId: string,
): Promise<AzureGroupMember[]> {
  return graphPaginateAll<AzureGroupMember>(
    `${GRAPH_BASE}/groups/${encodeURIComponent(groupId)}/members?$select=id,displayName,userPrincipalName&$top=999`,
    accessToken,
  );
}

export async function addGroupMember(
  accessToken: string,
  groupId: string,
  memberId: string,
): Promise<void> {
  const response = await fetch(
    `${GRAPH_BASE}/groups/${encodeURIComponent(groupId)}/members/$ref`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "@odata.id": `${GRAPH_BASE}/directoryObjects/${memberId}`,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Graph API add member error (${response.status}): ${body}`);
  }
}

export async function removeGroupMember(
  accessToken: string,
  groupId: string,
  memberId: string,
): Promise<void> {
  const response = await fetch(
    `${GRAPH_BASE}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/$ref`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Graph API remove member error (${response.status}): ${body}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Azure Resource Manager — Subscriptions
// ---------------------------------------------------------------------------

export async function listSubscriptions(
  accessToken: string,
): Promise<AzureSubscription[]> {
  return armPaginateAll<AzureSubscription>(
    `${ARM_BASE}/subscriptions?api-version=${ARM_API_VERSION_SUBS}`,
    accessToken,
  );
}

// ---------------------------------------------------------------------------
// Azure Resource Manager — Role Assignments
// ---------------------------------------------------------------------------

export async function listRoleAssignments(
  accessToken: string,
  scope: string,
): Promise<RoleAssignment[]> {
  return armPaginateAll<RoleAssignment>(
    `${ARM_BASE}${scope}/providers/Microsoft.Authorization/roleAssignments?api-version=${ARM_API_VERSION_RBAC}`,
    accessToken,
  );
}

export async function createRoleAssignment(
  accessToken: string,
  scope: string,
  assignmentName: string,
  roleDefinitionId: string,
  principalId: string,
  principalType: "User" | "Group" | "ServicePrincipal",
): Promise<RoleAssignment> {
  return armFetch<RoleAssignment>(
    `${ARM_BASE}${scope}/providers/Microsoft.Authorization/roleAssignments/${assignmentName}?api-version=${ARM_API_VERSION_RBAC}`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({
        properties: {
          roleDefinitionId,
          principalId,
          principalType,
        },
      }),
    },
  );
}

export async function deleteRoleAssignment(
  accessToken: string,
  scope: string,
  assignmentName: string,
): Promise<void> {
  const response = await fetch(
    `${ARM_BASE}${scope}/providers/Microsoft.Authorization/roleAssignments/${assignmentName}?api-version=${ARM_API_VERSION_RBAC}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(
      `ARM API delete role assignment error (${response.status}): ${body}`,
    );
  }
}
