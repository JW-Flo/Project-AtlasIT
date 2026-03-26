// Salesforce adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  SALESFORCE_CLIENT_ID: string;
  SALESFORCE_CLIENT_SECRET: string;
  SALESFORCE_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Salesforce API response types --

export interface SalesforceUser {
  Id: string;
  Username: string;
  Email: string;
  Name: string;
  FirstName?: string;
  LastName?: string;
  Title?: string;
  Department?: string;
  IsActive: boolean;
}

export interface SalesforceGroup {
  Id: string;
  Name: string;
  Type: string;
  Description?: string;
}

export interface SalesforceGroupMember {
  Id: string;
  GroupId: string;
  UserOrGroupId: string;
}

export interface SalesforceQueryResponse<T> {
  records: T[];
  totalSize: number;
  done: boolean;
  nextRecordsUrl?: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface SalesforceWebhookPayload {
  actionType: string;
  changeType: string;
  changedFields: string[];
  timestamp: number;
  entity: Record<string, unknown>;
}
