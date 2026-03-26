// SCIM 2.0 RFC 7644 types

export const SCIM_SCHEMAS = {
  USER: "urn:ietf:params:scim:schemas:core:2.0:User",
  GROUP: "urn:ietf:params:scim:schemas:core:2.0:Group",
  LIST_RESPONSE: "urn:ietf:params:scim:api:messages:2.0:ListResponse",
  PATCH_OP: "urn:ietf:params:scim:api:messages:2.0:PatchOp",
  ERROR: "urn:ietf:params:scim:api:messages:2.0:Error",
  SERVICE_PROVIDER_CONFIG:
    "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig",
  SCHEMA: "urn:ietf:params:scim:schemas:core:2.0:Schema",
} as const;

export interface ScimMeta {
  resourceType: string;
  created: string;
  lastModified: string;
  location: string;
}

export interface ScimName {
  givenName: string;
  familyName: string;
  formatted?: string;
}

export interface ScimEmail {
  value: string;
  type: string;
  primary: boolean;
}

export interface ScimUserResource {
  schemas: string[];
  id: string;
  externalId?: string;
  userName: string;
  name: ScimName;
  displayName: string;
  emails: ScimEmail[];
  active: boolean;
  title?: string;
  department?: string;
  meta: ScimMeta;
}

export interface ScimGroupMember {
  value: string;
  display?: string;
  $ref?: string;
}

export interface ScimGroupResource {
  schemas: string[];
  id: string;
  externalId?: string;
  displayName: string;
  members: ScimGroupMember[];
  meta: ScimMeta;
}

export interface ScimListResponse<T> {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

export interface ScimError {
  schemas: string[];
  detail: string;
  status: string;
  scimType?: string;
}

export interface ScimPatchOperation {
  op: "add" | "remove" | "replace";
  path?: string;
  value?: unknown;
}

export interface ScimPatchRequest {
  schemas: string[];
  Operations: ScimPatchOperation[];
}

export interface ScimCreateUserRequest {
  schemas: string[];
  userName: string;
  name: ScimName;
  displayName?: string;
  emails?: ScimEmail[];
  active?: boolean;
  externalId?: string;
  title?: string;
  department?: string;
}

export interface ScimCreateGroupRequest {
  schemas: string[];
  displayName: string;
  externalId?: string;
  members?: ScimGroupMember[];
}

export interface ScimFilterExpression {
  attribute: string;
  operator: "eq" | "co" | "sw" | "ew" | "pr";
  value: string;
}

export interface DirectoryUserRow {
  id: string;
  tenant_id: string;
  external_id: string;
  email: string;
  display_name: string | null;
  department: string | null;
  title: string | null;
  status: string;
  raw_attributes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectoryGroupRow {
  id: string;
  tenant_id: string;
  external_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectoryMembershipRow {
  user_id: string;
  display_name: string | null;
}
