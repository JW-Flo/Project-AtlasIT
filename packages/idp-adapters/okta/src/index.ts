import {
  DeprovisionRequest,
  DeprovisionResult,
  IdpAdapter,
  IdpGroup,
  IdpToken,
  IdpUser,
  IssueTokenOptions,
  LifecycleAwareIdpAdapter,
  MoveRequest,
  MoveResult,
  ProvisionRequest,
  ProvisionResult,
} from "@atlasit/idp";
import { registerAdapter } from "@atlasit/idp";
import {
  loadFixtureGroups,
  loadFixtureUsers,
  OktaFixtureGroup,
  OktaFixtureUser,
} from "./fixtures.js";

const OKTA_ADAPTER_ID = "okta";
const OKTA_FLAG_ENV = "FEATURE_IDP_OKTA";

function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function normaliseGroups(groupIds: string[] | undefined): string[] {
  if (!groupIds?.length) {
    return [];
  }
  return Array.from(new Set(groupIds)).sort();
}

export interface OktaAdapterOptions {
  users?: OktaFixtureUser[];
  groups?: OktaFixtureGroup[];
  defaultAudience?: string;
}

interface AdapterState {
  users: Map<string, OktaFixtureUser>;
  groups: Map<string, OktaFixtureGroup>;
}

class OktaOfflineAdapter implements LifecycleAwareIdpAdapter {
  readonly metadata = {
    name: "Okta Preview (offline)",
    kind: "okta",
    version: "0.1.0",
  } as const;

  private readonly defaultAudience: string;
  private state: AdapterState;

  constructor(options: OktaAdapterOptions = {}) {
    const users = options.users ?? loadFixtureUsers();
    const groups = options.groups ?? loadFixtureGroups();
    this.defaultAudience = options.defaultAudience ?? "atlasit-okta";
    this.state = {
      users: new Map(users.map((user) => [user.id, clone(user)])),
      groups: new Map(groups.map((group) => [group.id, clone(group)])),
    };
  }

  async provision(request: ProvisionRequest): Promise<ProvisionResult> {
    const groups = normaliseGroups(request.groups);
    const missing = groups.filter((groupId) => !this.state.groups.has(groupId));
    if (missing.length) {
      throw new Error(`Unknown groups: ${missing.join(",")}`);
    }

    const existing = this.findUser(request.user.id, request.user.email);
    const userRecord: OktaFixtureUser = {
      ...clone(existing ?? request.user),
      id: request.user.id,
      email: request.user.email,
      displayName: request.user.displayName ?? existing?.displayName,
      status: request.user.status ?? existing?.status ?? "active",
      attributes: {
        ...(existing?.attributes ?? {}),
        ...(request.user.attributes ?? {}),
      },
      groups,
    };

    this.state.users.set(userRecord.id, clone(userRecord));
    this.syncMembership(userRecord.id, groups);

    return {
      user: clone(userRecord),
      created: !existing,
    };
  }

  async move(request: MoveRequest): Promise<MoveResult> {
    const user = this.state.users.get(request.userId);
    if (!user) {
      throw new Error(`User ${request.userId} not found`);
    }

    const addGroups = normaliseGroups(request.addGroups);
    const missing = addGroups.filter(
      (groupId) => !this.state.groups.has(groupId),
    );
    if (missing.length) {
      throw new Error(`Unknown groups: ${missing.join(",")}`);
    }

    const remove = new Set(request.removeGroups ?? []);
    const nextGroupsSet = new Set(user.groups ?? []);

    for (const add of addGroups) {
      nextGroupsSet.add(add);
    }

    for (const removeId of remove) {
      nextGroupsSet.delete(removeId);
    }

    const nextGroups = Array.from(nextGroupsSet).sort();
    user.groups = nextGroups;
    this.state.users.set(user.id, clone(user));
    this.syncMembership(user.id, nextGroups);

    return { user: clone(user) };
  }

  async deprovision(request: DeprovisionRequest): Promise<DeprovisionResult> {
    const user = this.state.users.get(request.userId);
    if (!user) {
      throw new Error(`User ${request.userId} not found`);
    }

    user.status = "inactive";
    user.groups = [];
    this.state.users.set(user.id, clone(user));
    this.syncMembership(user.id, []);

    return { user: clone(user) };
  }

  async getUser(id: string): Promise<IdpUser | null> {
    const user = this.findUser(id, id);
    return user ? clone(user) : null;
  }

  async listUsers(): Promise<IdpUser[]> {
    return Array.from(this.state.users.values()).map((user) => clone(user));
  }

  async listGroups(): Promise<IdpGroup[]> {
    return Array.from(this.state.groups.values()).map((group) => clone(group));
  }

  async issueToken(options: IssueTokenOptions): Promise<IdpToken> {
    const issuedAt = new Date();
    const expiresAt = new Date(
      issuedAt.getTime() + (options.ttlSeconds ?? 3600) * 1000,
    );
    const payload = {
      iss: "okta://atlasit.dev",
      sub: options.subject,
      aud: options.audience ?? this.defaultAudience,
      iat: Math.floor(issuedAt.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      provider: "okta",
      ...(options.claims ?? {}),
    };

    const token = Buffer.from(JSON.stringify(payload), "utf8").toString(
      "base64url",
    );

    return {
      token,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  private findUser(id: string, email?: string): OktaFixtureUser | undefined {
    const direct = this.state.users.get(id);
    if (direct) {
      return clone(direct);
    }
    if (!email) {
      return undefined;
    }
    for (const user of this.state.users.values()) {
      if (user.email === email) {
        return clone(user);
      }
    }
    return undefined;
  }

  private syncMembership(userId: string, groups: string[]): void {
    const target = new Set(groups);
    for (const group of this.state.groups.values()) {
      const members = new Set(group.members ?? []);
      if (target.has(group.id)) {
        members.add(userId);
      } else {
        members.delete(userId);
      }
      group.members = Array.from(members).sort();
    }
  }
}

export function createOktaAdapter(
  options?: OktaAdapterOptions,
): LifecycleAwareIdpAdapter {
  return new OktaOfflineAdapter(options);
}

export function registerOktaAdapter(options?: OktaAdapterOptions): IdpAdapter {
  const adapter = createOktaAdapter(options);
  registerAdapter(OKTA_ADAPTER_ID, adapter, { flagEnvVar: OKTA_FLAG_ENV });
  return adapter;
}

export { OKTA_ADAPTER_ID, OKTA_FLAG_ENV, loadFixtureGroups, loadFixtureUsers };
