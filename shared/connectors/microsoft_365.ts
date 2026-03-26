import m365Research from "../integrations/research/microsoft_365.json";
import { requestWithRetry, requireField, requireIdentifier } from "./base";
import type {
  Connector,
  CreateUserParams,
  DeleteUserParams,
  GroupParams,
  SuspendUserParams,
  UpdateUserParams,
} from "./types";

export class Microsoft365Connector implements Connector {
  public readonly id = "microsoft_365";
  private readonly baseUrl = `${m365Research.api.baseUrl}/v1.0`;

  constructor(
    private readonly credentials: Record<string, string>,
    private oauthToken?: string | null,
  ) {}

  private async getToken(): Promise<string> {
    if (this.oauthToken) return this.oauthToken;

    const tenantId = requireField(this.credentials, "tenant_id");
    const clientId = requireField(this.credentials, "client_id");
    const clientSecret = requireField(this.credentials, "client_secret");

    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
      }).toString(),
    });

    if (!response.ok) throw new Error(`Microsoft token request failed (${response.status})`);
    const payload = (await response.json()) as { access_token: string };
    this.oauthToken = payload.access_token;
    return payload.access_token;
  }

  private async authHeaders() {
    return { authorization: `Bearer ${await this.getToken()}` };
  }

  async createUser(params: CreateUserParams) {
    return requestWithRetry(this.id, {
      action: "createUser",
      method: "POST",
      endpoint: `${this.baseUrl}/users`,
      headers: await this.authHeaders(),
      body: {
        accountEnabled: true,
        displayName: params.displayName || `${params.firstName || ""} ${params.lastName || ""}`.trim(),
        mailNickname: (params.email || params.username || "user").split("@")[0],
        userPrincipalName: params.email,
        passwordProfile: {
          forceChangePasswordNextSignIn: true,
          password: crypto.randomUUID(),
        },
        department: params.department,
        jobTitle: params.title,
      },
    });
  }

  async updateUser(params: UpdateUserParams) {
    return requestWithRetry(this.id, {
      action: "updateUser",
      method: "PATCH",
      endpoint: `${this.baseUrl}/users/${encodeURIComponent(requireIdentifier(params.userId || params.email, "userId"))}`,
      headers: await this.authHeaders(),
      body: {
        displayName: params.displayName,
        department: params.department,
        jobTitle: params.title,
        ...(params.attributes || {}),
      },
    });
  }

  async suspendUser(params: SuspendUserParams) {
    return requestWithRetry(this.id, {
      action: "suspendUser",
      method: "PATCH",
      endpoint: `${this.baseUrl}/users/${encodeURIComponent(params.userId)}`,
      headers: await this.authHeaders(),
      body: { accountEnabled: false },
    });
  }

  async deleteUser(params: DeleteUserParams) {
    return requestWithRetry(this.id, {
      action: "deleteUser",
      method: "DELETE",
      endpoint: `${this.baseUrl}/users/${encodeURIComponent(params.userId)}`,
      headers: await this.authHeaders(),
    });
  }

  async addToGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "addToGroup",
      method: "POST",
      endpoint: `${this.baseUrl}/groups/${encodeURIComponent(params.groupId)}/members/$ref`,
      headers: await this.authHeaders(),
      body: {
        "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${encodeURIComponent(params.userId)}`,
      },
    });
  }

  async removeFromGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "removeFromGroup",
      method: "DELETE",
      endpoint: `${this.baseUrl}/groups/${encodeURIComponent(params.groupId)}/members/${encodeURIComponent(params.userId)}/$ref`,
      headers: await this.authHeaders(),
    });
  }

  async testConnection() {
    const result = await requestWithRetry(this.id, {
      action: "testConnection",
      method: "GET",
      endpoint: `${this.baseUrl}/users?$top=1`,
      headers: await this.authHeaders(),
    });

    return { ok: result.ok, message: `Microsoft Graph healthy (${m365Research.api.endpoints.listUsers})` };
  }
}
