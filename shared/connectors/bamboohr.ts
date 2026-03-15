import bambooResearch from "../integrations/research/bamboohr.json";
import { requestWithRetry, requireField, requireIdentifier } from "./base";
import type {
  Connector,
  CreateUserParams,
  DeleteUserParams,
  GroupParams,
  SuspendUserParams,
  UpdateUserParams,
} from "./types";

function basicAuth(apiKey: string): string {
  return `Basic ${btoa(`${apiKey}:x`)}`;
}

export class BambooHrConnector implements Connector {
  public readonly id = "bamboohr";
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(credentials: Record<string, string>) {
    const companyDomain = requireField(credentials, "company_domain");
    const apiKey = requireField(credentials, "api_key");
    this.baseUrl = `https://api.bamboohr.com/api/gateway.php/${encodeURIComponent(companyDomain)}/v1`;
    this.authHeader = basicAuth(apiKey);
  }

  async createUser(params: CreateUserParams) {
    return requestWithRetry(this.id, {
      action: "createUser",
      method: "POST",
      endpoint: `${this.baseUrl}/employees/`,
      headers: { authorization: this.authHeader },
      body: {
        firstName: params.firstName,
        lastName: params.lastName,
        workEmail: params.email,
        department: params.department,
        jobTitle: params.title,
        ...(params.attributes || {}),
      },
    });
  }

  async updateUser(params: UpdateUserParams) {
    return requestWithRetry(this.id, {
      action: "updateUser",
      method: "POST",
      endpoint: `${this.baseUrl}/employees/${encodeURIComponent(requireIdentifier(params.userId, "userId"))}/`,
      headers: { authorization: this.authHeader },
      body: {
        firstName: params.firstName,
        lastName: params.lastName,
        workEmail: params.email,
        department: params.department,
        jobTitle: params.title,
        ...(params.attributes || {}),
      },
    });
  }

  async suspendUser(params: SuspendUserParams) {
    return requestWithRetry(this.id, {
      action: "suspendUser",
      method: "POST",
      endpoint: `${this.baseUrl}/employees/${encodeURIComponent(params.userId)}/`,
      headers: { authorization: this.authHeader },
      body: { status: "Inactive" },
    });
  }

  async deleteUser(params: DeleteUserParams) {
    return requestWithRetry(this.id, {
      action: "deleteUser",
      method: "POST",
      endpoint: `${this.baseUrl}/employees/${encodeURIComponent(params.userId)}/`,
      headers: { authorization: this.authHeader },
      body: { status: "Terminated" },
    });
  }

  async addToGroup(_: GroupParams) {
    return {
      ok: false,
      status: 501,
      message: "BambooHR does not support group assignment through this connector",
      evidence: {
        appId: this.id,
        action: "addToGroup",
        endpoint: bambooResearch.api.endpoints.addToGroup || "N/A",
        request: {},
        response: null,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async removeFromGroup(_: GroupParams) {
    return {
      ok: false,
      status: 501,
      message: "BambooHR does not support group removal through this connector",
      evidence: {
        appId: this.id,
        action: "removeFromGroup",
        endpoint: bambooResearch.api.endpoints.removeFromGroup || "N/A",
        request: {},
        response: null,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async testConnection() {
    const result = await requestWithRetry(this.id, {
      action: "testConnection",
      method: "GET",
      endpoint: `${this.baseUrl}/employees/directory`,
      headers: { authorization: this.authHeader },
    });

    return { ok: result.ok, message: `BambooHR connection healthy (${bambooResearch.api.endpoints.listUsers})` };
  }
}
