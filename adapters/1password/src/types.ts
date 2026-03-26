// 1Password adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  ONEPASSWORD_SERVICE_TOKEN: string;
}

export interface Variables {
  correlationId: string;
}

// -- 1Password SCIM API response types --

export interface OnePasswordUser {
  id: string;
  externalId?: string;
  userName: string;
  displayName: string;
  emails: Array<{
    value: string;
    primary?: boolean;
  }>;
  name: {
    givenName: string;
    familyName: string;
  };
  active: boolean;
  meta?: {
    created: string;
    lastModified: string;
  };
}

export interface OnePasswordGroup {
  id: string;
  displayName: string;
  description?: string;
  members?: Array<{
    value: string;
    display?: string;
  }>;
  meta?: {
    created: string;
    lastModified: string;
  };
}

export interface OnePasswordListResponse<T> {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}
