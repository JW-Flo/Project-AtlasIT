// Zoom adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  ZOOM_CLIENT_ID: string;
  ZOOM_CLIENT_SECRET: string;
  ZOOM_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Zoom API response types --

export interface ZoomUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: number; // 1=basic, 2=licensed, 3=on-prem
  pmi: number;
  timezone: string;
  dept?: string;
  created_at: string;
  last_login_time?: string;
  status: string; // active, inactive, pending
}

export interface ZoomGroup {
  id: string;
  name: string;
  total_members: number;
}

export interface ZoomGroupMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_id: string;
}

// -- Pagination --

export interface ZoomListResponse<T> {
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
  next_page_token?: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface ZoomWebhookPayload {
  event: string;
  payload: {
    account_id: string;
    object: {
      id?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      action?: string;
      [key: string]: unknown;
    };
  };
}
