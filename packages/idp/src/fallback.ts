import { IdpAdapter, IdpAdapterMetadata, IdpGroup, IdpToken, IdpUser, IssueTokenOptions, IdpProviderKind } from "./types.js";

const FALLBACK_KIND: IdpProviderKind = "fallback";

type UserStore = Map<string, IdpUser>;

type GroupStore = Map<string, IdpGroup>;

export interface DevFallbackOptions {
  audience?: string;
  ttlSeconds?: number;
  seedUsers?: IdpUser[];
  seedGroups?: IdpGroup[];
}

function clone<T>(value: T): T {
  return structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export class DevFallbackOidcProvider implements IdpAdapter {
  readonly metadata: IdpAdapterMetadata = {
    name: "AtlasIT Dev OIDC",
    kind: FALLBACK_KIND,
    version: "0.1.0",
  };

  private readonly users: UserStore = new Map();
  private readonly groups: GroupStore = new Map();
  private readonly audience: string;
  private readonly ttlSeconds: number;

  constructor(options: DevFallbackOptions = {}) {
    this.audience = options.audience ?? "atlasit-dev";
    this.ttlSeconds = options.ttlSeconds ?? 1800;

    for (const user of options.seedUsers ?? this.defaultUsers()) {
      this.registerUser(user);
    }
    for (const group of options.seedGroups ?? this.defaultGroups()) {
      this.registerGroup(group);
    }
  }

  private defaultUsers(): IdpUser[] {
    return [
      {
        id: "dev-user",
        email: "dev@example.local",
        displayName: "Dev User",
        status: "active",
      },
    ];
  }

  private defaultGroups(): IdpGroup[] {
    return [
      {
        id: "dev-admins",
        name: "Dev Admins",
        description: "Fallback administrators",
        members: ["dev-user"],
      },
    ];
  }

  registerUser(user: IdpUser): void {
    const copy = clone(user);
    this.users.set(copy.id, copy);
  }

  registerGroup(group: IdpGroup): void {
    const copy = clone(group);
    this.groups.set(copy.id, copy);
  }

  async getUser(id: string): Promise<IdpUser | null> {
    const found = this.users.get(id) ?? Array.from(this.users.values()).find((user) => user.email === id) ?? null;
    return found ? clone(found) : null;
  }

  async listUsers(): Promise<IdpUser[]> {
    return Array.from(this.users.values()).map((user) => clone(user));
  }

  async listGroups(): Promise<IdpGroup[]> {
    return Array.from(this.groups.values()).map((group) => clone(group));
  }

  async issueToken(options: IssueTokenOptions): Promise<IdpToken> {
    if (!this.users.has(options.subject)) {
      const placeholder: IdpUser = {
        id: options.subject,
        email: `${options.subject}@fallback.local`,
        displayName: options.subject,
        status: "active",
      };
      this.registerUser(placeholder);
    }

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + (options.ttlSeconds ?? this.ttlSeconds) * 1000);

    const payload = {
      iss: "atlasit-dev://oidc",
      sub: options.subject,
      aud: options.audience ?? this.audience,
      iat: Math.floor(issuedAt.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      provider: FALLBACK_KIND,
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

export function createDevFallbackProvider(options?: DevFallbackOptions): DevFallbackOidcProvider {
  return new DevFallbackOidcProvider(options);
}
