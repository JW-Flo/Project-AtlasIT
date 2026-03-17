export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  /** AWS access key ID (wrangler secret) */
  AWS_ACCESS_KEY_ID: string;
  /** AWS secret access key (wrangler secret) */
  AWS_SECRET_ACCESS_KEY: string;
  /** AWS region — defaults to us-east-1 for IAM */
  AWS_REGION?: string;
  CONNECTOR_ID: string;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

// --- IAM API types (parsed from XML responses) ---

export interface IAMUser {
  UserName: string;
  UserId: string;
  Arn: string;
  Path: string;
  CreateDate: string;
  PasswordLastUsed?: string;
  Tags?: IAMTag[];
}

export interface IAMGroup {
  GroupName: string;
  GroupId: string;
  Arn: string;
  Path: string;
  CreateDate: string;
}

export interface IAMPolicy {
  PolicyName: string;
  PolicyArn: string;
}

export interface IAMAccessKey {
  AccessKeyId: string;
  UserName: string;
  Status: string;
  CreateDate: string;
}

export interface IAMTag {
  Key: string;
  Value: string;
}

export interface IAMListResponse<T> {
  items: T[];
  isTruncated: boolean;
  marker?: string;
}

export interface SyncResult {
  users: { created: number; updated: number; total: number };
  groups: { created: number; updated: number; total: number };
}
