// QuickBooks adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  QUICKBOOKS_CLIENT_ID: string;
  QUICKBOOKS_CLIENT_SECRET: string;
  QUICKBOOKS_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- QuickBooks API response types --

export interface QuickBooksCustomer {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: { City?: string; CountrySubDivisionCode?: string };
  Active: boolean;
  MetaData: { CreateTime: string; UpdateTime: string };
}

export interface QuickBooksEmployee {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: { City?: string; CountrySubDivisionCode?: string };
  Active: boolean;
  MetaData: { CreateTime: string; UpdateTime: string };
}

export interface QuickBooksQueryResponse<T> {
  QueryResponse: {
    Customer?: T[];
    Employee?: T[];
    maxResults?: number;
    startPosition?: number;
    totalCount?: number;
  };
  time: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface QuickBooksWebhookPayload {
  eventNotifications: Array<{
    realmId: string;
    dataChangeEvent: {
      entities: Array<{
        name: string;
        id: string;
        operation: string;
        lastUpdated: string;
      }>;
    };
  }>;
}
