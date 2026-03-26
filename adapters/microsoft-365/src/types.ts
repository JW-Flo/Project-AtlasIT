export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface GraphUser {
  id: string;
  userPrincipalName: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  department?: string;
  jobTitle?: string;
  accountEnabled?: boolean;
}

export interface GraphGroup {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
  groupTypes: string[];
}

export interface GraphMember {
  "@odata.type": string;
  id: string;
  displayName?: string;
  userPrincipalName?: string;
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
  token_type: string;
  scope?: string;
}
