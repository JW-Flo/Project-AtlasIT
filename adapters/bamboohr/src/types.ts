// BambooHR adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  BAMBOOHR_API_KEY: string;
  BAMBOOHR_WEBHOOK_SECRET: string;
}

export interface Variables {
  correlationId: string;
}

// -- BambooHR API response types --

export interface BambooHREmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone?: string;
  status: string;
  department?: string;
  jobTitle?: string;
  workEmail?: string;
  personalEmail?: string;
}

export interface BambooHRDirectory {
  employees: BambooHREmployee[];
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface BambooHRWebhookPayload {
  eventType: string;
  eventId?: string;
  timestamp?: string;
  employee?: BambooHREmployee;
  [key: string]: unknown;
}
