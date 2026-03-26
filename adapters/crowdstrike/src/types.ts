// CrowdStrike adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  CROWDSTRIKE_CLIENT_ID: string;
  CROWDSTRIKE_CLIENT_SECRET: string;
  CROWDSTRIKE_BASE_URL: string;
}

export interface Variables {
  correlationId: string;
}

// -- CrowdStrike API response types --

export interface CrowdStrikeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CrowdStrikeUser {
  uid: string;
  uuid: string;
  first_name: string;
  last_name: string;
  customer: string;
}

export interface CrowdStrikeDevice {
  device_id: string;
  cid: string;
  hostname: string;
  platform_name: string;
  os_version: string;
  external_ip: string;
  local_ip: string;
  mac_address: string;
  system_manufacturer: string;
  system_product_name: string;
  last_seen: string;
  first_seen: string;
  status: string;
  agent_version: string;
  service_pack_major: string;
  tags: string[];
  groups: string[];
  modified_timestamp: string;
}

export interface CrowdStrikeHostGroup {
  id: string;
  name: string;
  description: string;
  group_type: string;
  assignment_rule: string;
  created_by: string;
  created_timestamp: string;
  modified_by: string;
  modified_timestamp: string;
}

export interface CrowdStrikeResourceResponse<T> {
  meta: {
    query_time: number;
    pagination?: {
      offset: number;
      limit: number;
      total: number;
    };
    powered_by: string;
    trace_id: string;
  };
  resources: T[];
  errors: Array<{ code: number; message: string }>;
}

export interface CrowdStrikeIdResponse {
  meta: {
    query_time: number;
    pagination?: {
      offset: number;
      limit: number;
      total: number;
    };
    powered_by: string;
    trace_id: string;
  };
  resources: string[];
  errors: Array<{ code: number; message: string }>;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook/Detection event types --

export interface CrowdStrikeDetectionEvent {
  detection_id: string;
  device: {
    device_id: string;
    hostname: string;
    platform_name: string;
  };
  behaviors: Array<{
    behavior_id: string;
    tactic: string;
    technique: string;
    severity: number;
    description: string;
    timestamp: string;
  }>;
  max_severity: number;
  max_severity_displayname: string;
  first_behavior: string;
  last_behavior: string;
  status: string;
}

export interface CrowdStrikeWebhookPayload {
  event_type: string;
  detection_id?: string;
  device_id?: string;
  hostname?: string;
  severity?: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}
