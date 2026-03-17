export type Bindings = {
  DB: D1Database;
  FIGMA_CLIENT_ID: string;
  FIGMA_CLIENT_SECRET: string;
  CRED_ENCRYPTION_KEY: string;
  ORCHESTRATOR_URL: string;
  CONNECTOR_ID: string;
};

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

export interface FigmaUser {
  id: string;
  email: string;
  handle?: string;
  img_url?: string;
  role?: string;
}

export interface FigmaTeamMember {
  id: string;
  email: string;
  handle?: string;
  img_url?: string;
}
