export type Bindings = {
  DB: D1Database;
  ZENDESK_CLIENT_ID: string;
  ZENDESK_CLIENT_SECRET: string;
  ZENDESK_WEBHOOK_SECRET: string;
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

export interface ZendeskUser {
  id: number;
  email: string;
  name: string;
  role: string;
  organization_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ZendeskOrganization {
  id: number;
  name: string;
  details?: string;
  created_at?: string;
  updated_at?: string;
}
