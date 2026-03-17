export type Bindings = {
  DB: D1Database;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
  AUTH0_WEBHOOK_SECRET: string;
  CRED_ENCRYPTION_KEY: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_SECRET: string;
  CONNECTOR_ID: string;
};

export interface Variables {
  correlationId: string;
}

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface Auth0User {
  user_id: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  picture?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Auth0Organization {
  id: string;
  name: string;
  display_name?: string;
  created_at?: string;
}

export interface Auth0Member {
  user_id: string;
  email: string;
  name?: string;
}
