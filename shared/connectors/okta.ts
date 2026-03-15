import oktaResearch from "../integrations/research/okta.json";
import { requestWithRetry, requireField, requireIdentifier } from "./base";
import type {
  Connector,
  CreateUserParams,
  DeleteUserParams,
  GroupParams,
  SuspendUserParams,
  UpdateUserParams,
} from "./types";

export class OktaConnector implements Connector {
  public readonly id = "okta";

  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(
    private readonly credentials: Record<string, string>,
    oauthToken?: string | null,
  ) {
    this.baseUrl = requireField(credentials, "okta_domain").replace(/\/$/, "");
    if (oauthToken) {
      this.authHeader = `Bearer ${oauthToken}`;
    } else {
      this.authHeader = `SSWS ${requireField(credentials, "api_token")}`;
    }
  }

  async createUser(params: CreateUserParams) {
    return requestWithRetry(this.id, {
      action: "createUser",
      method: "POST",
      endpoint: `${this.baseUrl}/api/v1/users?activate=true`,
      headers: { authorization: this.authHeader },
      body: {
        profile: {
          firstName: params.firstName || "Unknown",
          lastName: params.lastName || "User",
          email: params.email,
          login: params.username || params.email,
          department: params.department,
          title: params.title,
          manager: params.manager,
          ...(params.attributes || {}),
        },
      },
    });
  }

  async updateUser(params: UpdateUserParams) {
    return requestWithRetry(this.id, {
      action: "updateUser",
      method: "PUT",
      endpoint: `${this.baseUrl}/api/v1/users/${encodeURIComponent(requireIdentifier(params.userId || params.email, "userId"))}`,
      headers: { authorization: this.authHeader },
      body: {
        profile: {
          firstName: params.firstName,
          lastName: params.lastName,
          email: params.email,
          login: params.username || params.email,
          department: params.department,
          title: params.title,
          manager: params.manager,
          ...(params.attributes || {}),
        },
      },
    });
  }

  async suspendUser(params: SuspendUserParams) {
    return requestWithRetry(this.id, {
      action: "suspendUser",
      method: "POST",
      endpoint: `${this.baseUrl}/api/v1/users/${encodeURIComponent(params.userId)}/lifecycle/suspend`,
      headers: { authorization: this.authHeader },
    });
  }

  async deleteUser(params: DeleteUserParams) {
    if (!params.hardDelete) {
      await requestWithRetry(this.id, {
        action: "deactivateUser",
        method: "POST",
        endpoint: `${this.baseUrl}/api/v1/users/${encodeURIComponent(params.userId)}/lifecycle/deactivate`,
        headers: { authorization: this.authHeader },
      });
    }

    return requestWithRetry(this.id, {
      action: "deleteUser",
      method: "DELETE",
      endpoint: `${this.baseUrl}/api/v1/users/${encodeURIComponent(params.userId)}`,
      headers: { authorization: this.authHeader },
    });
  }

  async addToGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "addToGroup",
      method: "PUT",
      endpoint: `${this.baseUrl}/api/v1/groups/${encodeURIComponent(params.groupId)}/users/${encodeURIComponent(params.userId)}`,
      headers: { authorization: this.authHeader },
    });
  }

  async removeFromGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "removeFromGroup",
      method: "DELETE",
      endpoint: `${this.baseUrl}/api/v1/groups/${encodeURIComponent(params.groupId)}/users/${encodeURIComponent(params.userId)}`,
      headers: { authorization: this.authHeader },
    });
  }

  async testConnection() {
    const url = `${this.baseUrl}/api/v1/users?limit=1`;
    const result = await requestWithRetry(this.id, {
      action: "testConnection",
      method: "GET",
      endpoint: url,
      headers: { authorization: this.authHeader },
    });

    return {
      ok: result.ok,
      message: result.ok
        ? `Okta connection healthy (${oktaResearch.api.endpoints.listUsers})`
        : "Okta connection failed",
    };
  }
}
