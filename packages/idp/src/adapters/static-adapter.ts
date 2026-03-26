import { IdpAdapter, IdpAdapterMetadata, IdpGroup, IdpProviderKind, IdpToken, IdpUser, IssueTokenOptions } from "../types.js";

export interface StaticAdapterConfig {
  kind: IdpProviderKind;
  name: string;
  version?: string;
  users: IdpUser[];
  groups: IdpGroup[];
  defaultAudience?: string;
}

function clone<T>(value: T): T {
  return structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export class StaticIdpAdapter implements IdpAdapter {
  readonly metadata: IdpAdapterMetadata;

  constructor(private readonly config: StaticAdapterConfig) {
    this.metadata = {
      name: config.name,
      kind: config.kind,
      version: config.version,
    };
  }

  async getUser(id: string): Promise<IdpUser | null> {
    const found = this.config.users.find((user) => user.id === id || user.email === id);
    return found ? clone(found) : null;
  }

  async listUsers(): Promise<IdpUser[]> {
    return clone(this.config.users);
  }

  async listGroups(): Promise<IdpGroup[]> {
    return clone(this.config.groups);
  }

  async issueToken(options: IssueTokenOptions): Promise<IdpToken> {
    const audience = options.audience ?? this.config.defaultAudience ?? "atlasit-internal";
    const ttlSeconds = options.ttlSeconds ?? 3600;
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + ttlSeconds * 1000);

    const payload = {
      iss: `${this.metadata.kind}://atlasit.dev`,
      sub: options.subject,
      aud: audience,
      iat: Math.floor(issuedAt.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      provider: this.metadata.kind,
      ...(options.claims ?? {}),
    };

    const token = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

    return {
      token,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }
}
