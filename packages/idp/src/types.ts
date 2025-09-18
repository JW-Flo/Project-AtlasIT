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
