// GCP adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  SERVICE_ACCOUNT_CREDENTIALS: string;
  PRIVATEKEY: string;
}

export interface Variables {
  correlationId: string;
}

// -- GCP IAM Policy types --

export interface GcpIamBinding {
  role: string;
  members: string[];
  condition?: {
    title: string;
    description?: string;
    expression: string;
  };
}

export interface GcpIamPolicy {
  version: number;
  etag: string;
  bindings: GcpIamBinding[];
}

/**
 * Parsed IAM member from a policy binding.
 * Raw format: "user:alice@example.com", "serviceAccount:sa@proj.iam.gserviceaccount.com", "group:grp@example.com"
 */
export interface GcpIamMember {
  type: "user" | "serviceAccount" | "group" | "domain" | "deleted";
  email: string;
  roles: string[];
}

// -- Cloud Identity / Groups types --

export interface GcpGroup {
  name: string; // e.g. "groups/abc123"
  groupKey: {
    id: string; // email address
    namespace?: string;
  };
  parent: string; // e.g. "customers/C012345"
  displayName: string;
  description: string;
  createTime: string;
  updateTime: string;
  labels?: Record<string, string>;
}

export interface GcpGroupsListResponse {
  groups: GcpGroup[];
  nextPageToken?: string;
}

export interface GcpMembership {
  name: string; // e.g. "groups/abc123/memberships/def456"
  preferredMemberKey: {
    id: string; // email
    namespace?: string;
  };
  createTime: string;
  updateTime: string;
  roles: Array<{
    name: string; // "MEMBER", "OWNER", "MANAGER"
    expiryDetail?: {
      expireTime: string;
    };
  }>;
  type: string; // "USER", "SERVICE_ACCOUNT", "GROUP", etc.
}

export interface GcpMembershipsListResponse {
  memberships: GcpMembership[];
  nextPageToken?: string;
}

// -- Cloud Resource Manager types --

export interface GcpProject {
  projectId: string;
  name: string;
  projectNumber: string;
  lifecycleState: string;
  createTime: string;
  parent?: {
    type: string;
    id: string;
  };
}

// -- Pub/Sub webhook types --

export interface PubSubPushMessage {
  message: {
    data: string; // base64-encoded
    attributes: Record<string, string>;
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

export interface PubSubDecodedPayload {
  protoPayload?: {
    methodName: string;
    resourceName: string;
    authenticationInfo?: {
      principalEmail: string;
    };
    request?: Record<string, unknown>;
    response?: Record<string, unknown>;
    serviceName: string;
  };
  resource?: {
    type: string;
    labels: Record<string, string>;
  };
  timestamp: string;
  severity: string;
  logName: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Service account credentials --

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}
