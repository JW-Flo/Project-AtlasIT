// Notion adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Notion API response types --

export interface NotionUser {
  object: "user";
  id: string;
  type: string;
  name?: string;
  avatar_url?: string;
  person?: {
    email?: string;
  };
}

export interface NotionDatabase {
  object: "database";
  id: string;
  title: Array<{ type: string; text?: { content: string } }>;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types (Notion doesn't support webhooks, polling only) --

export interface NotionWebhookPayload {
  event: string;
  timestamp: number;
}
