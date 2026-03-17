// DocuSign adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  DOCUSIGN_CLIENT_ID: string;
  DOCUSIGN_CLIENT_SECRET: string;
  DOCUSIGN_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- DocuSign API response types --

export interface DocuSignUser {
  userId: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  createdDate?: string;
  uri?: string;
}

export interface DocuSignGroup {
  groupId: string;
  groupName: string;
  permissionProfileId?: string;
  users?: DocuSignUser[];
  usersCount?: number;
  uri?: string;
}

export interface DocuSignUsersResponse {
  resultSetSize: number;
  startPosition: number;
  endPosition: number;
  totalSetSize: number;
  nextUri?: string;
  users: DocuSignUser[];
}

export interface DocuSignGroupsResponse {
  resultSetSize: number;
  startPosition: number;
  endPosition: number;
  totalSetSize: number;
  nextUri?: string;
  groups: DocuSignGroup[];
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface DocuSignWebhookPayload {
  apiVersion: string;
  uri: string;
  createdDateTime: string;
  data: {
    accountId: string;
    userId?: string;
    groupId?: string;
    action?: string;
    [key: string]: unknown;
  };
  eventType: string;
  [key: string]: unknown;
}
