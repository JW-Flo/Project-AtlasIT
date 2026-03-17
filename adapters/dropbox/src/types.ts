// Dropbox adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  DROPBOX_CLIENT_ID: string;
  DROPBOX_CLIENT_SECRET: string;
  DROPBOX_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Dropbox API response types --

export interface DropboxUser {
  account_id: string;
  email: string;
  email_verified: boolean;
  display_name: string;
  disabled: boolean;
  member_folder_id?: string;
  external_id?: string;
  account_type?: string;
}

export interface DropboxGroup {
  group_id: string;
  group_name: string;
  group_external_id?: string;
  group_management_type?: string;
  created: number;
  members?: DropboxGroupMember[];
}

export interface DropboxGroupMember {
  account_id: string;
  display_name: string;
  email: string;
}

export interface DropboxListMembersResponse {
  members: DropboxUser[];
  cursor?: string;
  has_more: boolean;
}

export interface DropboxListGroupsResponse {
  groups: DropboxGroup[];
  cursor?: string;
  has_more: boolean;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface DropboxWebhookPayload {
  list_members_events?: DropboxWebhookEvent[];
  list_groups_events?: DropboxWebhookEvent[];
}

export interface DropboxWebhookEvent {
  type: string;
  account_id?: string;
  group_id?: string;
  email?: string;
  display_name?: string;
}
