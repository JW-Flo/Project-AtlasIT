// ADP adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  ADP_CLIENT_ID: string;
  ADP_CLIENT_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
  SSLCERT: string;
  SSLKEY: string;
}

export interface Variables {
  correlationId: string;
}

// -- ADP API response types --

export interface ADPLegalName {
  givenName: string;
  middleName?: string;
  familyName1: string;
  formattedName?: string;
}

export interface ADPEmail {
  emailUri: string;
  nameCode?: { codeValue: string; shortName?: string };
}

export interface ADPPhone {
  dialNumber: string;
  countryDialing?: string;
  formattedNumber?: string;
  nameCode?: { codeValue: string; shortName?: string };
}

export interface ADPCommunication {
  emails?: ADPEmail[];
  landlines?: ADPPhone[];
  mobiles?: ADPPhone[];
}

export interface ADPPerson {
  legalName: ADPLegalName;
  birthDate?: string;
  communication?: ADPCommunication;
}

export interface ADPBusinessCommunication {
  emails?: ADPEmail[];
  landlines?: ADPPhone[];
  mobiles?: ADPPhone[];
}

export interface ADPWorkLocation {
  nameCode?: { codeValue: string; shortName?: string };
  address?: {
    lineOne?: string;
    cityName?: string;
    countrySubdivisionLevel1?: { codeValue?: string };
    countryCode?: string;
    postalCode?: string;
  };
}

export interface ADPReportsTo {
  positionID?: string;
  associateOID?: string;
  workerID?: { idValue: string };
  reportsToWorkerName?: { formattedName?: string };
}

export interface ADPWorkAssignment {
  primaryIndicator: boolean;
  assignmentStatus?: {
    statusCode?: { codeValue: string; shortName?: string };
    reasonCode?: { codeValue: string; shortName?: string };
  };
  jobTitle?: string;
  managementPositionIndicator?: boolean;
  homeOrganizationalUnit?: {
    nameCode?: { codeValue: string; shortName?: string };
  };
  homeWorkLocation?: ADPWorkLocation;
  assignedWorkLocations?: ADPWorkLocation[];
  reportsTo?: ADPReportsTo[];
}

export interface ADPWorkerStatus {
  statusCode?: { codeValue: string; shortName?: string };
  reasonCode?: { codeValue: string; shortName?: string };
}

export interface ADPWorker {
  associateOID: string;
  workerID?: { idValue: string };
  person: ADPPerson;
  businessCommunication?: ADPBusinessCommunication;
  workerStatus?: ADPWorkerStatus;
  workerDates?: {
    originalHireDate?: string;
    terminationDate?: string;
  };
  workAssignments?: ADPWorkAssignment[];
}

export interface ADPWorkersResponse {
  workers: ADPWorker[];
  meta?: {
    totalNumber?: number;
  };
}

// -- ADP Organization Department types --

export interface ADPDepartment {
  departmentCode: { codeValue: string; shortName?: string };
  longName?: string;
  shortName?: string;
  parentDepartmentCode?: { codeValue: string };
  supervisorWorkerID?: { idValue: string };
}

export interface ADPOrganizationDepartmentsResponse {
  organizationDepartments: ADPDepartment[];
  meta?: {
    totalNumber?: number;
  };
}

// -- ADP Webhook payload types --

export interface ADPEventContext {
  worker?: { associateOID: string };
  eventNameCode?: { codeValue: string; shortName?: string };
}

export interface ADPNotificationEvent {
  eventID: string;
  serviceCategoryCode?: { codeValue: string };
  eventNameCode?: { codeValue: string; shortName?: string };
  eventStatusCode?: { codeValue: string };
  effectiveDateTime?: string;
  creationDateTime?: string;
  data?: {
    eventContext?: ADPEventContext;
    output?: Record<string, unknown>;
  };
}

export interface ADPWebhookPayload {
  events: ADPNotificationEvent[];
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}
