// Figma adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  FIGMA_CLIENT_ID: string;
  FIGMA_CLIENT_SECRET: string;
  FIGMA_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Figma API response types --

export interface FigmaUser {
  id: string;
  email: string;
  handle?: string;
  img_url?: string;
  role?: string;
}

export interface FigmaTeam {
  id: string;
  name: string;
  description?: string;
}

export interface FigmaTeamMember {
  id: string;
  email: string;
  handle?: string;
  img_url?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface FigmaWebhookPayload {
  event_type: string;
  team_id?: string;
  file_key?: string;
  file_name?: string;
  passcode?: string;
  timestamp?: string;
  retries?: number;
  webhook_id?: string;
  triggered_by?: {
    id: string;
    handle: string;
  };
  description?: string;
}
