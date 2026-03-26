// HubSpot adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  HUBSPOT_CLIENT_ID: string;
  HUBSPOT_CLIENT_SECRET: string;
  HUBSPOT_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- HubSpot API response types --

export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    lifecyclestage?: string;
    hs_analytics_num_visits?: string;
    hs_analytics_num_page_views?: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotList {
  id: string;
  name: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
  processingState: string;
}

// -- Pagination --

export interface HubSpotListResponse<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
  total?: number;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface HubSpotWebhookPayload {
  eventId: number;
  portalId: number;
  occurredAt: number;
  subscriptionType: string;
  attemptNumber: number;
  objectId: number;
  changeSource?: string;
  changedProperties?: string[];
  propertyName?: string;
  propertyValue?: string;
}
