import type {
  JiraUser,
  JiraProject,
  JiraIssue,
  JiraSearchResponse,
  JiraUserSearchResponse,
  ScimUserResource,
  ScimGroupResource,
  ScimListResponse,
  ScimCreateUserRequest,
  ScimPatchRequest,
} from "./types.js";

// ---------- Jira Cloud REST API v3 ----------

const JIRA_REST_BASE = "https://api.atlassian.com/ex/jira";
const SCIM_BASE = "https://api.atlassian.com/scim/directory";

async function jiraFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Jira API error (${response.status}): ${body}`);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function restUrl(cloudId: string, path: string): string {
  return `${JIRA_REST_BASE}/${encodeURIComponent(cloudId)}/rest/api/3${path}`;
}

function scimUrl(directoryId: string, path: string): string {
  return `${SCIM_BASE}/${encodeURIComponent(directoryId)}${path}`;
}

// ---------- REST: Users ----------

export async function listUsers(
  cloudId: string,
  accessToken: string,
  options?: { startAt?: number; maxResults?: number },
): Promise<JiraUser[]> {
  const allUsers: JiraUser[] = [];
  let startAt = options?.startAt ?? 0;
  const maxResults = options?.maxResults ?? 100;

  // Jira /users/search uses startAt/maxResults offset pagination
  let hasMore = true;
  while (hasMore) {
    const url = new URL(restUrl(cloudId, "/users/search"));
    url.searchParams.set("startAt", String(startAt));
    url.searchParams.set("maxResults", String(maxResults));

    const users = await jiraFetch<JiraUser[]>(url.toString(), accessToken);
    allUsers.push(...users);

    if (users.length < maxResults) {
      hasMore = false;
    } else {
      startAt += maxResults;
    }
  }

  return allUsers;
}

export async function getUser(
  cloudId: string,
  accessToken: string,
  accountId: string,
): Promise<JiraUser> {
  const url = new URL(restUrl(cloudId, "/user"));
  url.searchParams.set("accountId", accountId);
  return jiraFetch<JiraUser>(url.toString(), accessToken);
}

// ---------- REST: Issues ----------

export async function searchIssues(
  cloudId: string,
  accessToken: string,
  jql: string,
  options?: { startAt?: number; maxResults?: number; fields?: string[] },
): Promise<JiraSearchResponse> {
  const url = restUrl(cloudId, "/search");
  const body = {
    jql,
    startAt: options?.startAt ?? 0,
    maxResults: options?.maxResults ?? 50,
    fields: options?.fields ?? [
      "summary",
      "status",
      "issuetype",
      "priority",
      "assignee",
      "reporter",
      "created",
      "updated",
      "project",
    ],
  };

  return jiraFetch<JiraSearchResponse>(url, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---------- REST: Projects ----------

export async function getProject(
  cloudId: string,
  accessToken: string,
  projectIdOrKey: string,
): Promise<JiraProject> {
  const url = restUrl(
    cloudId,
    `/project/${encodeURIComponent(projectIdOrKey)}`,
  );
  return jiraFetch<JiraProject>(url, accessToken);
}

export async function listProjects(
  cloudId: string,
  accessToken: string,
  options?: { startAt?: number; maxResults?: number },
): Promise<JiraProject[]> {
  const allProjects: JiraProject[] = [];
  let startAt = options?.startAt ?? 0;
  const maxResults = options?.maxResults ?? 50;

  let hasMore = true;
  while (hasMore) {
    const url = new URL(restUrl(cloudId, "/project/search"));
    url.searchParams.set("startAt", String(startAt));
    url.searchParams.set("maxResults", String(maxResults));

    const response = await jiraFetch<{
      values: JiraProject[];
      total: number;
      isLast: boolean;
    }>(url.toString(), accessToken);

    allProjects.push(...response.values);

    if (response.isLast || response.values.length < maxResults) {
      hasMore = false;
    } else {
      startAt += maxResults;
    }
  }

  return allProjects;
}

// ---------- SCIM: Users ----------

export async function scimListUsers(
  directoryId: string,
  accessToken: string,
  options?: { startIndex?: number; count?: number; filter?: string },
): Promise<ScimListResponse<ScimUserResource>> {
  const url = new URL(scimUrl(directoryId, "/Users"));
  url.searchParams.set("startIndex", String(options?.startIndex ?? 1));
  url.searchParams.set("count", String(options?.count ?? 100));
  if (options?.filter) {
    url.searchParams.set("filter", options.filter);
  }

  return jiraFetch<ScimListResponse<ScimUserResource>>(
    url.toString(),
    accessToken,
  );
}

export async function scimGetUser(
  directoryId: string,
  accessToken: string,
  userId: string,
): Promise<ScimUserResource> {
  const url = scimUrl(directoryId, `/Users/${encodeURIComponent(userId)}`);
  return jiraFetch<ScimUserResource>(url, accessToken);
}

export async function scimCreateUser(
  directoryId: string,
  accessToken: string,
  user: ScimCreateUserRequest,
): Promise<ScimUserResource> {
  const url = scimUrl(directoryId, "/Users");
  return jiraFetch<ScimUserResource>(url, accessToken, {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export async function scimUpdateUser(
  directoryId: string,
  accessToken: string,
  userId: string,
  patch: ScimPatchRequest,
): Promise<ScimUserResource> {
  const url = scimUrl(directoryId, `/Users/${encodeURIComponent(userId)}`);
  return jiraFetch<ScimUserResource>(url, accessToken, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function scimDeleteUser(
  directoryId: string,
  accessToken: string,
  userId: string,
): Promise<void> {
  const url = scimUrl(directoryId, `/Users/${encodeURIComponent(userId)}`);
  await jiraFetch<void>(url, accessToken, { method: "DELETE" });
}

// ---------- SCIM: Groups ----------

export async function scimListGroups(
  directoryId: string,
  accessToken: string,
  options?: { startIndex?: number; count?: number; filter?: string },
): Promise<ScimListResponse<ScimGroupResource>> {
  const url = new URL(scimUrl(directoryId, "/Groups"));
  url.searchParams.set("startIndex", String(options?.startIndex ?? 1));
  url.searchParams.set("count", String(options?.count ?? 100));
  if (options?.filter) {
    url.searchParams.set("filter", options.filter);
  }

  return jiraFetch<ScimListResponse<ScimGroupResource>>(
    url.toString(),
    accessToken,
  );
}

export async function scimGetGroup(
  directoryId: string,
  accessToken: string,
  groupId: string,
): Promise<ScimGroupResource> {
  const url = scimUrl(directoryId, `/Groups/${encodeURIComponent(groupId)}`);
  return jiraFetch<ScimGroupResource>(url, accessToken);
}
