import slackResearch from "../integrations/research/slack.json";
import { requestWithRetry, requireField, requireIdentifier } from "./base";
import type {
  Connector,
  CreateUserParams,
  DeleteUserParams,
  GroupParams,
  SuspendUserParams,
  UpdateUserParams,
} from "./types";

export class SlackConnector implements Connector {
  public readonly id = "slack";
  private readonly authHeader: string;
  private readonly baseUrl: string;

  constructor(credentials: Record<string, string>, oauthToken?: string | null) {
    this.baseUrl = slackResearch.api.scim.endpoint?.replace(/\/$/, "") || "https://api.slack.com/scim/v2";
    const token = oauthToken || requireField(credentials, "bot_token");
    this.authHeader = `Bearer ${token}`;
  }

  async createUser(params: CreateUserParams) {
    return requestWithRetry(this.id, {
      action: "createUser",
      method: "POST",
      endpoint: `${this.baseUrl}/Users`,
      headers: { authorization: this.authHeader },
      body: {
        userName: params.username || params.email,
        name: { givenName: params.firstName, familyName: params.lastName },
        displayName: params.displayName,
        emails: params.email ? [{ value: params.email, primary: true }] : undefined,
        active: true,
      },
    });
  }

  async updateUser(params: UpdateUserParams) {
    return requestWithRetry(this.id, {
      action: "updateUser",
      method: "PATCH",
      endpoint: `${this.baseUrl}/Users/${encodeURIComponent(requireIdentifier(params.userId, "userId"))}`,
      headers: { authorization: this.authHeader },
      body: {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        Operations: [
          {
            op: "replace",
            value: {
              displayName: params.displayName,
              title: params.title,
              department: params.department,
              ...(params.attributes || {}),
            },
          },
        ],
      },
    });
  }

  async suspendUser(params: SuspendUserParams) {
    return requestWithRetry(this.id, {
      action: "suspendUser",
      method: "PATCH",
      endpoint: `${this.baseUrl}/Users/${encodeURIComponent(params.userId)}`,
      headers: { authorization: this.authHeader },
      body: {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        Operations: [{ op: "replace", value: { active: false } }],
      },
    });
  }

  async deleteUser(params: DeleteUserParams) {
    return requestWithRetry(this.id, {
      action: "deleteUser",
      method: "DELETE",
      endpoint: `${this.baseUrl}/Users/${encodeURIComponent(params.userId)}`,
      headers: { authorization: this.authHeader },
    });
  }

  async addToGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "addToGroup",
      method: "PATCH",
      endpoint: `${this.baseUrl}/Groups/${encodeURIComponent(params.groupId)}`,
      headers: { authorization: this.authHeader },
      body: {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        Operations: [{ op: "add", path: "members", value: [{ value: params.userId }] }],
      },
    });
  }

  async removeFromGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "removeFromGroup",
      method: "PATCH",
      endpoint: `${this.baseUrl}/Groups/${encodeURIComponent(params.groupId)}`,
      headers: { authorization: this.authHeader },
      body: {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        Operations: [{ op: "remove", path: `members[value eq \"${params.userId}\"]` }],
      },
    });
  }

  async testConnection() {
    const result = await requestWithRetry(this.id, {
      action: "testConnection",
      method: "GET",
      endpoint: `${this.baseUrl}/Users?count=1`,
      headers: { authorization: this.authHeader },
    });

    return {
      ok: result.ok,
      message: `Slack SCIM health check (${slackResearch.api.endpoints.listUsers})`,
    };
  }
}
