// Zscaler adapter type definitions

export interface Bindings {
  ATLAS_SHARED_DB: D1Database;
  KV_CACHE: KVNamespace;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  ZSCALER_CLIENT_ID: string;
  ZSCALER_CLIENT_SECRET: string;
  ZSCALER_VANITY_DOMAIN: string;
  ZSCALER_CLOUD: string;
  ZSCALER_CUSTOMER_ID: string;
}

export interface Variables {
  correlationId: string;
}

// -- Zscaler OAuth token response --

export interface ZscalerTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// -- ZIdentity user types --

export interface ZscalerUser {
  id: string;
  loginName: string;
  displayName: string;
  primaryEmail: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt?: string;
  updatedAt?: string;
}

export interface ZscalerCreateUserRequest {
  loginName: string;
  displayName: string;
  primaryEmail: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ZscalerUpdateUserRequest {
  loginName?: string;
  displayName?: string;
  primaryEmail?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface ZscalerUsersListResponse {
  users: ZscalerUser[];
  totalResults?: number;
  startIndex?: number;
  itemsPerPage?: number;
}

// -- ZIdentity group types --

export interface ZscalerGroup {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZscalerGroupsListResponse {
  groups: ZscalerGroup[];
}

// -- ZPA SCIM group types --

export interface ZscalerScimGroup {
  id: string;
  name: string;
  idpId?: string;
  idpGroupId?: string;
}

export interface ZscalerScimGroupsListResponse {
  list: ZscalerScimGroup[];
  totalPages?: number;
}

// -- Canonical user profile (adapter contract) --

export interface CanonicalUserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  jobTitle?: string;
  department?: string;
  externalId?: string;
}

// -- Sync result --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}
