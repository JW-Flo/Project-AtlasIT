// Xero adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  XERO_CLIENT_ID: string;
  XERO_CLIENT_SECRET: string;
  XERO_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Xero API response types --

export interface XeroContact {
  ContactID: string;
  Name: string;
  EmailAddress?: string;
  FirstName?: string;
  LastName?: string;
  Status: string; // ACTIVE, ARCHIVED, GDPRREQUEST
  UpdatedUtc?: string;
}

export interface XeroUser {
  UserID: string;
  EmailAddress: string;
  FirstName: string;
  LastName: string;
  IsSubscriber: boolean;
  UpdatedUtc?: string;
}

export interface XeroAPIResponse<T> {
  Contacts?: T[];
  Users?: T[];
  Id: string;
  ProviderName: string;
  DateTimeUTC: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface XeroWebhookPayload {
  webhook_key: string;
  webhookEvents: Array<{
    eventCategory: string;
    eventType: string;
    eventDateUtc: string;
    resourceUrl: string;
    resourceId: string;
    tenantId: string;
  }>;
}
