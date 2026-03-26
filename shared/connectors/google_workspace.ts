import googleResearch from "../integrations/research/google_workspace.json";
import { requestWithRetry, requireField, requireIdentifier } from "./base";
import type {
  Connector,
  CreateUserParams,
  DeleteUserParams,
  GroupParams,
  SuspendUserParams,
  UpdateUserParams,
} from "./types";

function toBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export class GoogleWorkspaceConnector implements Connector {
  public readonly id = "google_workspace";
  private readonly baseUrl = googleResearch.api.baseUrl;

  constructor(
    private readonly credentials: Record<string, string>,
    private oauthToken?: string | null,
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.oauthToken) return this.oauthToken;

    const clientEmail = requireField(this.credentials, "client_email");
    const privateKey = requireField(this.credentials, "private_key");
    const adminEmail = requireField(this.credentials, "admin_email");
    const tokenUrl = googleResearch.auth.tokenUrl;

    const now = Math.floor(Date.now() / 1000);
    const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = toBase64Url(
      JSON.stringify({
        iss: clientEmail,
        scope: (googleResearch.auth.scopes.joiner || []).join(" "),
        aud: tokenUrl,
        sub: adminEmail,
        iat: now,
        exp: now + 3600,
      }),
    );

    const unsigned = `${header}.${claim}`;
    const key = await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(privateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
    const jwt = `${unsigned}.${toBase64Url(String.fromCharCode(...new Uint8Array(signature)))}`;

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });

    if (!res.ok) {
      throw new Error(`Google token exchange failed (${res.status})`);
    }

    const data = (await res.json()) as { access_token: string };
    this.oauthToken = data.access_token;
    return this.oauthToken;
  }

  private async authHeaders() {
    return { authorization: `Bearer ${await this.getAccessToken()}` };
  }

  async createUser(params: CreateUserParams) {
    return requestWithRetry(this.id, {
      action: "createUser",
      method: "POST",
      endpoint: `${this.baseUrl}/admin/directory/v1/users`,
      headers: await this.authHeaders(),
      body: {
        primaryEmail: params.email,
        name: { givenName: params.firstName, familyName: params.lastName },
        password: crypto.randomUUID(),
        orgUnitPath: params.department ? `/${params.department}` : undefined,
      },
    });
  }

  async updateUser(params: UpdateUserParams) {
    const userKey = encodeURIComponent(requireIdentifier(params.userId || params.email, "userId"));
    return requestWithRetry(this.id, {
      action: "updateUser",
      method: "PUT",
      endpoint: `${this.baseUrl}/admin/directory/v1/users/${userKey}`,
      headers: await this.authHeaders(),
      body: {
        primaryEmail: params.email,
        name: { givenName: params.firstName, familyName: params.lastName },
        orgUnitPath: params.department ? `/${params.department}` : undefined,
        ...(params.attributes || {}),
      },
    });
  }

  async suspendUser(params: SuspendUserParams) {
    return requestWithRetry(this.id, {
      action: "suspendUser",
      method: "PUT",
      endpoint: `${this.baseUrl}/admin/directory/v1/users/${encodeURIComponent(params.userId)}`,
      headers: await this.authHeaders(),
      body: { suspended: true },
    });
  }

  async deleteUser(params: DeleteUserParams) {
    return requestWithRetry(this.id, {
      action: "deleteUser",
      method: "DELETE",
      endpoint: `${this.baseUrl}/admin/directory/v1/users/${encodeURIComponent(params.userId)}`,
      headers: await this.authHeaders(),
    });
  }

  async addToGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "addToGroup",
      method: "POST",
      endpoint: `${this.baseUrl}/admin/directory/v1/groups/${encodeURIComponent(params.groupId)}/members`,
      headers: await this.authHeaders(),
      body: {
        email: params.userId,
        role: params.role || "MEMBER",
      },
    });
  }

  async removeFromGroup(params: GroupParams) {
    return requestWithRetry(this.id, {
      action: "removeFromGroup",
      method: "DELETE",
      endpoint: `${this.baseUrl}/admin/directory/v1/groups/${encodeURIComponent(params.groupId)}/members/${encodeURIComponent(params.userId)}`,
      headers: await this.authHeaders(),
    });
  }

  async testConnection() {
    const result = await requestWithRetry(this.id, {
      action: "testConnection",
      method: "GET",
      endpoint: `${this.baseUrl}/admin/directory/v1/users?maxResults=1`,
      headers: await this.authHeaders(),
    });

    return { ok: result.ok, message: `Google Workspace healthy (${googleResearch.api.endpoints.listUsers})` };
  }
}
