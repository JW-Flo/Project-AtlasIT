// Workday adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  WORKDAY_CLIENT_ID: string;
  WORKDAY_CLIENT_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- Workday API response types --

export interface WorkdayWorker {
  id: string;
  descriptor: string;
  primaryWorkEmail: string | null;
  isActive: boolean;
  hireDate: string | null;
  terminationDate: string | null;
  businessTitle: string | null;
  supervisoryOrganization: WorkdayOrgRef | null;
  positions: WorkdayPosition[];
}

export interface WorkdayPosition {
  id: string;
  descriptor: string;
  businessTitle: string | null;
  startDate: string | null;
  endDate: string | null;
  workerType: string | null;
  organizationRef: WorkdayOrgRef | null;
}

export interface WorkdayOrgRef {
  id: string;
  descriptor: string;
}

export interface WorkdayOrganization {
  id: string;
  descriptor: string;
  type: string;
  subType: string | null;
  isActive: boolean;
  members: WorkdayOrgMemberRef[];
}

export interface WorkdayOrgMemberRef {
  id: string;
  descriptor: string;
}

export interface WorkdayListResponse<T> {
  data: T[];
  total: number;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface WorkdayBusinessProcessEvent {
  eventType: string;
  effectiveDate: string;
  worker: {
    id: string;
    descriptor: string;
    primaryWorkEmail: string | null;
  };
  businessProcess: {
    id: string;
    descriptor: string;
    type: string;
  };
  initiator: {
    id: string;
    descriptor: string;
  } | null;
  organization: WorkdayOrgRef | null;
}
