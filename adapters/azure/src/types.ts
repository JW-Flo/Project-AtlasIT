export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  AZURE_CLIENT_ID: string;
  AZURE_CLIENT_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

export interface AzureUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string | null;
  givenName: string | null;
  surname: string | null;
  jobTitle: string | null;
  department: string | null;
  accountEnabled: boolean;
  officeLocation: string | null;
  mobilePhone: string | null;
}

export interface AzureGroup {
  id: string;
  displayName: string;
  description: string | null;
  mailEnabled: boolean;
  securityEnabled: boolean;
  groupTypes: string[];
}

export interface AzureGroupMember {
  "@odata.type": string;
  id: string;
  displayName: string;
  userPrincipalName?: string;
}

export interface AzureSubscription {
  subscriptionId: string;
  displayName: string;
  state: "Enabled" | "Disabled" | "Warned" | "PastDue" | "Deleted";
  tenantId: string;
}

export interface RoleAssignment {
  id: string;
  name: string;
  properties: {
    roleDefinitionId: string;
    principalId: string;
    principalType: "User" | "Group" | "ServicePrincipal";
    scope: string;
  };
}

export interface GraphPagedResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

export interface ArmPagedResponse<T> {
  value: T[];
  nextLink?: string;
}

export interface GraphChangeNotification {
  value: Array<{
    subscriptionId: string;
    changeType: "created" | "updated" | "deleted";
    resource: string;
    resourceData: {
      "@odata.type": string;
      "@odata.id": string;
      id: string;
    };
    tenantId: string;
    clientState?: string;
  }>;
}
