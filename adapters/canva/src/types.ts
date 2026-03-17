// Canva adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  CANVA_CLIENT_ID: string;
  CANVA_CLIENT_SECRET: string;
  CANVA_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Canva API response types --

export interface CanvaUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface CanvaTeamMembersResponse {
  items: CanvaUser[];
  has_more: boolean;
  cursor?: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface CanvaWebhookPayload {
  event_type: string;
  user?: CanvaUser;
  team_id?: string;
  timestamp?: string;
}
