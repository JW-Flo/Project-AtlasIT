// Confluence adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  CONFLUENCE_CLIENT_ID: string;
  CONFLUENCE_CLIENT_SECRET: string;
  CONFLUENCE_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Confluence API response types --

export interface ConfluenceUser {
  accountId: string;
  accountType: string;
  email: string;
  publicName: string;
  isActive: boolean;
  profile?: {
    displayName: string;
    pictureUrl?: string;
  };
}

export interface ConfluenceGroup {
  name: string;
  type: string;
  id?: string;
}

export interface ConfluenceGroupUser {
  accountId: string;
  accountType: string;
  email: string;
  publicName: string;
  isActive: boolean;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface ConfluenceWebhookPayload {
  webhookEvent: string;
  user?: ConfluenceUser;
  group?: ConfluenceGroup;
  timestamp?: number;
}
