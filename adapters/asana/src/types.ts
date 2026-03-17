// Asana adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  ASANA_CLIENT_ID: string;
  ASANA_CLIENT_SECRET: string;
  ASANA_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Asana API response types --

export interface AsanaUser {
  gid: string;
  name: string;
  email: string;
  avatar?: {
    image_1024x1024?: string;
  };
}

export interface AsanaTeam {
  gid: string;
  name: string;
  description?: string;
  organization?: {
    gid: string;
    name: string;
  };
}

export interface AsanaTeamMember {
  gid: string;
  name: string;
  email: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface AsanaWebhookPayload {
  events: Array<{
    type: string;
    action: string;
    resource: {
      gid: string;
      name?: string;
      email?: string;
    };
    user?: {
      gid: string;
      name: string;
      email: string;
    };
    timestamp?: number;
  }>;
}
