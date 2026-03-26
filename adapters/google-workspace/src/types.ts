export type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  CRED_ENCRYPTION_KEY: string;
  ORCHESTRATOR_URL: string;
  CONNECTOR_ID: string;
  /** HMAC secret for signing outbound event publish calls to the orchestrator. */
  EVENT_PUBLISH_SECRET: string;
};

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

export interface GoogleUser {
  id: string;
  primaryEmail: string;
  name: { fullName?: string; givenName?: string; familyName?: string };
  orgUnitPath?: string;
  suspended?: boolean;
  organizations?: Array<{ department?: string; title?: string }>;
}

export interface GoogleGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
}

export interface GoogleMember {
  id: string;
  email: string;
  role: string;
  type: string;
}
