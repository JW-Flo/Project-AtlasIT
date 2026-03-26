// PagerDuty adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  PAGERDUTY_API_KEY: string;
  PAGERDUTY_WEBHOOK_SECRET: string;
}

export interface Variables {
  correlationId: string;
}

// -- PagerDuty API response types --

export interface PagerDutyUser {
  id: string;
  type: string;
  summary: string;
  self: string;
  html_url: string;
  name: string;
  email: string;
  time_zone: string;
  color: string;
  avatar_url: string | null;
  user_url: string;
  invitation_sent: boolean;
  confirmation_token: string | null;
  teams: Array<{ id: string; type: string; summary: string }>;
}

export interface PagerDutyTeam {
  id: string;
  type: string;
  summary: string;
  self: string;
  html_url: string;
  name: string;
  description: string | null;
  escalation_policies?: Array<{ id: string; type: string }>;
  users?: PagerDutyUser[];
}

export interface PagerDutyWebhookPayload {
  messages: Array<{
    type: string;
    data: {
      type: string;
      id: string;
      summary: string;
      self: string;
      user?: PagerDutyUser;
      team?: PagerDutyTeam;
    };
  }>;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Pagination types --

export interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  more: boolean;
}
