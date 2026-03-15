import githubResearch from "../integrations/research/github.json";
import { requestWithRetry, requireField, requireIdentifier } from "./base";
import type {
  Connector,
  CreateUserParams,
  DeleteUserParams,
  GroupParams,
  SuspendUserParams,
  UpdateUserParams,
} from "./types";

export class GitHubConnector implements Connector {
  public readonly id = "github";
  private readonly baseUrl = githubResearch.api.baseUrl;
  private readonly authHeader: string;
  private readonly org: string;

  constructor(credentials: Record<string, string>, oauthToken?: string | null) {
    this.org = requireField(credentials, "organization");
    const token =
      oauthToken || requireField(credentials, "personal_access_token");
    this.authHeader = `Bearer ${token}`;
  }

  private headers() {
    return {
      authorization: this.authHeader,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    };
  }

  async createUser(params: CreateUserParams) {
    return requestWithRetry(this.id, {
      action: "createUser",
      method: "PUT",
      endpoint: `${this.baseUrl}/orgs/${encodeURIComponent(this.org)}/memberships/${encodeURIComponent(requireIdentifier(params.username || params.email, "username"))}`,
      headers: this.headers(),
      body: { role: params.attributes?.role || "member" },
    });
  }

  async updateUser(params: UpdateUserParams) {
    return requestWithRetry(this.id, {
      action: "updateUser",
      method: "PUT",
      endpoint: `${this.baseUrl}/orgs/${encodeURIComponent(this.org)}/memberships/${encodeURIComponent(requireIdentifier(params.username || params.userId, "username"))}`,
      headers: this.headers(),
      body: { role: params.attributes?.role || "member" },
    });
  }

  async suspendUser(params: SuspendUserParams) {
    // GitHub has no suspend concept — demote to outside collaborator
    // rather than removing membership (which is destructive/irreversible)
    return requestWithRetry(this.id, {
      action: "suspendUser",
      method: "PUT",
      endpoint: `${this.baseUrl}/orgs/${encodeURIComponent(this.org)}/outside_collaborators/${encodeURIComponent(params.userId)}`,
      headers: this.headers(),
    });
  }

  async deleteUser(params: DeleteUserParams) {
    return requestWithRetry(this.id, {
      action: "removeOrgMembership",
      method: "DELETE",
      endpoint: `${this.baseUrl}/orgs/${encodeURIComponent(this.org)}/memberships/${encodeURIComponent(params.userId)}`,
      headers: this.headers(),
    });
  }

  async addToGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "addTeamMember",
      method: "PUT",
      endpoint: `${this.baseUrl}/orgs/${encodeURIComponent(this.org)}/teams/${encodeURIComponent(params.groupId)}/memberships/${encodeURIComponent(params.userId)}`,
      headers: this.headers(),
      body: { role: params.role || "member" },
    });
  }

  async removeFromGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "removeTeamMember",
      method: "DELETE",
      endpoint: `${this.baseUrl}/orgs/${encodeURIComponent(this.org)}/teams/${encodeURIComponent(params.groupId)}/memberships/${encodeURIComponent(params.userId)}`,
      headers: this.headers(),
    });
  }

  async testConnection() {
    const result = await requestWithRetry(this.id, {
      action: "testConnection",
      method: "GET",
      endpoint: `${this.baseUrl}/orgs/${encodeURIComponent(this.org)}/members?per_page=1`,
      headers: this.headers(),
    });

    return {
      ok: result.ok,
      message: `GitHub connection healthy (${githubResearch.api.endpoints.listOrgMembers})`,
    };
  }
}
