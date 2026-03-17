// Microsoft Teams adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  TEAMS_CLIENT_ID: string;
  TEAMS_CLIENT_SECRET: string;
  TEAMS_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Microsoft Graph API response types --

export interface GraphUser {
  id: string;
  userPrincipalName: string;
  displayName: string | null;
  mail: string | null;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  department?: string;
}

export interface GraphTeam {
  id: string;
  displayName: string;
  description?: string;
}

export interface GraphDirectoryObject {
  id: string;
  displayName?: string;
  mail?: string;
}

export interface GraphPaginatedResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface TeamsWebhookPayload {
  value: Array<{
    changeType: string;
    clientState: string;
    resource: string;
    subscriptionId: string;
    tenantId?: string;
    resourceData?: Record<string, unknown>;
  }>;
}
