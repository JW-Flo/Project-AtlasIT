import type {
  IdentityProvider,
  ProvisionRequest,
  MoveRequest,
  DeprovisionRequest,
  OperationResult,
  IdpUser,
  IdpGroup,
} from "@atlasit/idp";
import { USERS, GROUPS } from "./fixtures.ts";

function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export class OktaMockAdapter implements IdentityProvider {
  public readonly id = "okta";
  public readonly displayName = "Okta Mock";
  public readonly featureFlag = "FEATURE_IDP_OKTA";

  private users: IdpUser[] = clone(USERS);
  private groups: IdpGroup[] = clone(GROUPS);

  async provisionUser(request: ProvisionRequest): Promise<OperationResult> {
    const existing = this.users.find(
      (u) => u.id === request.user.id || u.email === request.user.email,
    );
    if (existing) {
      existing.status = "active";
      existing.attributes = {
        ...existing.attributes,
        ...request.user.attributes,
      };
      return { ok: true, message: "User reactivated", user: clone(existing) };
    }
    const user: IdpUser = {
      ...request.user,
      status: request.user.status ?? "active",
    };
    this.users.push(user);
    if (request.groups?.length) {
      this.addUserToGroups(user.id, request.groups);
    }
    return { ok: true, message: "User provisioned", user: clone(user) };
  }

  async moveUser(request: MoveRequest): Promise<OperationResult> {
    const user = this.users.find((u) => u.id === request.userId);
    if (!user) {
      return { ok: false, message: "User not found" };
    }
    if (request.targetGroups) {
      this.removeUserFromAllGroups(request.userId);
      this.addUserToGroups(request.userId, request.targetGroups);
    }
    return { ok: true, message: "User moved", user: clone(user) };
  }

  async deprovisionUser(request: DeprovisionRequest): Promise<OperationResult> {
    const user = this.users.find((u) => u.id === request.userId);
    if (!user) return { ok: false, message: "User not found" };
    user.status = "inactive";
    this.removeUserFromAllGroups(request.userId);
    return { ok: true, message: "User deprovisioned", user: clone(user) };
  }

  async getUser(id: string): Promise<IdpUser | null> {
    const user = this.users.find((u) => u.id === id || u.email === id);
    return user ? clone(user) : null;
  }

  async listGroups(): Promise<IdpGroup[]> {
    return clone(this.groups);
  }

  private removeUserFromAllGroups(userId: string) {
    this.groups = this.groups.map((group) => ({
      ...group,
      members: group.members?.filter((member) => member !== userId) ?? [],
    }));
  }

  private addUserToGroups(userId: string, groupIds: string[]) {
    const groupSet = new Set(groupIds);
    this.groups = this.groups.map((group) => {
      if (!groupSet.has(group.id)) return group;
      const members = new Set(group.members ?? []);
      members.add(userId);
      return {
        ...group,
        members: Array.from(members),
      };
    });
  }
}

const adapter = new OktaMockAdapter();

export function getOktaAdapter() {
  return adapter;
}

export default adapter;
export { USERS, GROUPS } from "./fixtures.ts";
