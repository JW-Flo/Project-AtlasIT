export interface Bindings {
  DB: D1Database;
  OKTA_API_TOKEN: string;
  OKTA_ORG_URL: string;
  OKTA_WEBHOOK_SECRET: string;
  ORCHESTRATOR_URL: string;
  CONNECTOR_ID: string;
  SCIM_API_TOKEN: string;
}

export interface OktaUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  login: string;
  mobilePhone?: string;
  department?: string;
  title?: string;
  displayName?: string;
}

export interface OktaUser {
  id: string;
  status: string;
  created: string;
  lastUpdated: string;
  profile: OktaUserProfile;
}

export interface OktaGroup {
  id: string;
  created: string;
  lastUpdated: string;
  type: string;
  profile: {
    name: string;
    description?: string;
  };
}

export interface SyncResult {
  users: { created: number; updated: number; total: number };
  groups: { created: number; updated: number; total: number };
}

export interface OktaEventHookPayload {
  eventType: string;
  events: OktaEvent[];
}

export interface OktaEvent {
  uuid: string;
  published: string;
  eventType: string;
  actor: {
    id: string;
    type: string;
    alternateId: string;
    displayName: string;
  };
  target?: Array<{
    id: string;
    type: string;
    alternateId: string;
    displayName: string;
  }>;
}
