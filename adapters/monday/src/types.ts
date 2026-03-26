// Monday.com adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  MONDAY_CLIENT_ID: string;
  MONDAY_CLIENT_SECRET: string;
  MONDAY_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Monday.com API response types --

export interface MondayUser {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  account_owner?: boolean;
  created_at?: string;
}

export interface MondayTeam {
  id: string;
  name: string;
  owner?: MondayUser;
  users?: MondayUser[];
  created_at?: string;
}

export interface MondayGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface MondayWebhookPayload {
  type: string;
  trigger: string;
  user?: MondayUser;
  team?: MondayTeam;
  events?: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
}
