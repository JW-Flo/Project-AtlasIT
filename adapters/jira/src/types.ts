// Jira Cloud REST API v3 + Atlassian SCIM types

// ---------- Bindings ----------

export interface Bindings {
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  DB: D1Database;
  JIRA_CLIENT_ID: string;
  JIRA_CLIENT_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

// ---------- Jira REST API types ----------

export interface JiraUser {
  accountId: string;
  accountType: string;
  emailAddress?: string;
  displayName: string;
  active: boolean;
  avatarUrls?: Record<string, string>;
  timeZone?: string;
  locale?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  description?: string;
  lead?: JiraUser;
  avatarUrls?: Record<string, string>;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: { name: string; id: string };
    issuetype: { name: string; id: string };
    priority?: { name: string; id: string };
    assignee?: JiraUser | null;
    reporter?: JiraUser | null;
    created: string;
    updated: string;
    project: { id: string; key: string; name: string };
    description?: unknown;
    labels?: string[];
    [key: string]: unknown;
  };
}

export interface JiraSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraUserSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  values: JiraUser[];
  isLast: boolean;
}

// ---------- Atlassian SCIM types ----------

export interface ScimName {
  givenName: string;
  familyName: string;
  formatted?: string;
}

export interface ScimEmail {
  value: string;
  type: string;
  primary: boolean;
}

export interface ScimUserResource {
  id: string;
  userName: string;
  name: ScimName;
  displayName: string;
  emails: ScimEmail[];
  active: boolean;
  title?: string;
  department?: string;
  externalId?: string;
  meta?: {
    resourceType: string;
    created: string;
    lastModified: string;
    location: string;
  };
}

export interface ScimGroupResource {
  id: string;
  displayName: string;
  members?: Array<{ value: string; display?: string }>;
  externalId?: string;
  meta?: {
    resourceType: string;
    created: string;
    lastModified: string;
    location: string;
  };
}

export interface ScimListResponse<T> {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

export interface ScimCreateUserRequest {
  schemas: string[];
  userName: string;
  name: ScimName;
  displayName?: string;
  emails?: ScimEmail[];
  active?: boolean;
  externalId?: string;
  title?: string;
  department?: string;
}

export interface ScimPatchOperation {
  op: "add" | "remove" | "replace";
  path?: string;
  value?: unknown;
}

export interface ScimPatchRequest {
  schemas: string[];
  Operations: ScimPatchOperation[];
}

// ---------- Sync types ----------

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// ---------- Webhook event types ----------

export interface JiraWebhookPayload {
  timestamp: number;
  webhookEvent: string;
  issue_event_type_name?: string;
  user?: JiraUser;
  issue?: JiraIssue;
  changelog?: {
    id: string;
    items: Array<{
      field: string;
      fieldtype: string;
      from: string | null;
      fromString: string | null;
      to: string | null;
      toString: string | null;
    }>;
  };
}

// ---------- Tenant config ----------

export interface JiraTenantConfig {
  cloudId: string;
  directoryId?: string;
}
