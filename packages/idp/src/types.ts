export type IdpProviderKind =
  | "okta"
  | "entra"
  | "google-workspace"
  | "aws-cognito"
  | "paycom"
  | "crowdstrike"
  | "fallback";

export interface IdpAdapterMetadata {
  /** Human readable provider name (e.g. "Okta Preview"). */
  name: string;
  /** Provider kind shorthand used in routing. */
  kind: IdpProviderKind;
  /** Optional semantic version for the adapter implementation. */
  version?: string;
}

export interface IdpUser {
  id: string;
  email: string;
  displayName?: string;
  status?: "active" | "inactive" | "suspended" | string;
  groups?: string[];
  attributes?: Record<string, string>;
}

export interface IdpGroup {
  id: string;
  name: string;
  description?: string;
  members?: string[];
}

export interface IssueTokenOptions {
  subject: string;
  audience?: string;
  ttlSeconds?: number;
  claims?: Record<string, unknown>;
}

export interface IdpToken {
  token: string;
  issuedAt: string;
  expiresAt: string;
}

export interface IdpAdapter {
  readonly metadata: IdpAdapterMetadata;
  getUser(id: string): Promise<IdpUser | null>;
  listUsers(): Promise<IdpUser[]>;
  listGroups(): Promise<IdpGroup[]>;
  issueToken(options: IssueTokenOptions): Promise<IdpToken>;
}

export interface ProvisionRequest {
  user: IdpUser;
  groups: string[];
}

export interface ProvisionResult {
  user: IdpUser;
  created: boolean;
}

export interface MoveRequest {
  userId: string;
  addGroups?: string[];
  removeGroups?: string[];
}

export interface MoveResult {
  user: IdpUser;
}

export interface DeprovisionRequest {
  userId: string;
  reason?: string;
}

export interface DeprovisionResult {
  user: IdpUser;
}

export interface IdpLifecycleOperations {
  provision(request: ProvisionRequest): Promise<ProvisionResult>;
  move(request: MoveRequest): Promise<MoveResult>;
  deprovision(request: DeprovisionRequest): Promise<DeprovisionResult>;
}

export type LifecycleAwareIdpAdapter = IdpAdapter & IdpLifecycleOperations;

export interface AdapterRegistrationOptions {
  flagEnvVar: string;
}

export interface RegisteredAdapter {
  id: string;
  flagEnvVar: string;
  impl: IdpAdapter;
}

export interface ListedAdapter extends RegisteredAdapter {
  enabled: boolean;
}
