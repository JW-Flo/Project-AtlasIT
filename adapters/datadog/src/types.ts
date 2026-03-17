// Datadog adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  DATADOG_API_KEY: string;
  DATADOG_APP_KEY: string;
}

export interface Variables {
  correlationId: string;
}

// -- Datadog API response types --

export interface DatadogUser {
  id: string;
  type: string;
  attributes: {
    name: string;
    email: string;
    status: string;
    verified: boolean;
    created_at: string;
    modified_at: string;
    disabled: boolean;
  };
  relationships?: {
    roles?: {
      data: Array<{ id: string; type: string }>;
    };
  };
}

export interface DatadogRole {
  id: string;
  type: string;
  attributes: {
    name: string;
    created_at: string;
    modified_at: string;
    description?: string;
  };
}

export interface DatadogGroup {
  id: string;
  type: string;
  attributes: {
    name: string;
    description?: string;
    created_at: string;
    modified_at: string;
  };
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Pagination types --

export interface PaginationInfo {
  cursor?: string;
  limit: number;
  total: number;
}
