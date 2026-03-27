import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

const TENANT_ID = "tenant-test-456";
const ACCESS_TOKEN = "ghs_provision_token";
const ORG_NAME = "test-org";
const USER_EMAIL = "jane.doe@example.com";
const GITHUB_USERNAME = "janedoe";

const BASE_ENV = {
  ADAPTER_SECRET: "internal-secret",
  ORCHESTRATOR_URL: "https://orchestrator.test",
  ADAPTER_NAME: "github",
  GITHUB_CLIENT_ID: "client-id",
  GITHUB_CLIENT_SECRET: "client-secret",
  GITHUB_WEBHOOK_SECRET: "webhook-secret",
  OAUTH2_REDIRECT_URI: "https://github-adapter.test/auth/callback",
  EVENT_PUBLISH_SECRET: "",
};

function makeDb(overrides: {
  tokenRow?: { access_token: string } | null;
  configRow?: { config: string } | null;
} = {}) {
  const tokenRow =
    "tokenRow" in overrides ? overrides.tokenRow : { access_token: ACCESS_TOKEN };
  const configRow =
    "configRow" in overrides
      ? overrides.configRow
      : { config: JSON.stringify({ orgName: ORG_NAME }) };

  return {
    prepare: vi.fn().mockImplementation((sql: string) => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockImplementation(async () => {
        if (sql.includes("connector_tokens")) return tokenRow;
        if (sql.includes("connector_configs")) return configRow;
        return null;
      }),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({}),
    })),
  };
}

function makeProvisionRequest(body: Record<string, unknown>) {
  return new Request("https://github-adapter.test/api/provision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer internal-secret",
      "X-Tenant-ID": TENANT_ID,
    },
    body: JSON.stringify(body),
  });
}

function makeDeprovisionRequest(body: Record<string, unknown>) {
  return new Request("https://github-adapter.test/api/deprovision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer internal-secret",
      "X-Tenant-ID": TENANT_ID,
    },
    body: JSON.stringify(body),
  });
}

function mockResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/provision", () => {
  it("returns 400 when tenantId is missing from body and header", async () => {
    const req = new Request("https://github-adapter.test/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer internal-secret",
      },
      body: JSON.stringify({ userProfile: { email: USER_EMAIL } }),
    });

    const res = await app.fetch(req, { DB: makeDb(), ...BASE_ENV });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/tenant/i);
  });

  it("returns 400 when userProfile.email is missing", async () => {
    const res = await app.fetch(
      makeProvisionRequest({ tenantId: TENANT_ID, userProfile: {} }),
      { DB: makeDb(), ...BASE_ENV },
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/email/i);
  });

  it("invites user to GitHub org and returns success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("search/users")) {
          return Promise.resolve(
            mockResponse(200, { total_count: 1, items: [{ login: GITHUB_USERNAME }] }),
          );
        }
        if (typeof url === "string" && url.includes(`/memberships/${GITHUB_USERNAME}`)) {
          return Promise.resolve(
            mockResponse(200, { state: "active", role: "member" }),
          );
        }
        return Promise.resolve(mockResponse(404));
      }),
    );

    const res = await app.fetch(
      makeProvisionRequest({
        tenantId: TENANT_ID,
        userProfile: { email: USER_EMAIL },
      }),
      { DB: makeDb(), ...BASE_ENV },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; status: string };
    expect(data.success).toBe(true);
    expect(data.status).toBe("provisioned");
  });

  it("returns 404 when no GitHub account matches the email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(200, { total_count: 0, items: [] }),
      ),
    );

    const res = await app.fetch(
      makeProvisionRequest({
        tenantId: TENANT_ID,
        userProfile: { email: USER_EMAIL },
      }),
      { DB: makeDb(), ...BASE_ENV },
    );

    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/No GitHub account/i);
  });

  it("returns 502 when GitHub invite API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("search/users")) {
          return Promise.resolve(
            mockResponse(200, { total_count: 1, items: [{ login: GITHUB_USERNAME }] }),
          );
        }
        return Promise.resolve(mockResponse(500, { message: "Internal Server Error" }));
      }),
    );

    const res = await app.fetch(
      makeProvisionRequest({
        tenantId: TENANT_ID,
        userProfile: { email: USER_EMAIL },
      }),
      { DB: makeDb(), ...BASE_ENV },
    );

    expect(res.status).toBe(502);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBeTruthy();
  });
});

describe("POST /api/deprovision", () => {
  it("returns 400 when tenantId is missing from body and header", async () => {
    const req = new Request("https://github-adapter.test/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer internal-secret",
      },
      body: JSON.stringify({ userProfile: { email: USER_EMAIL } }),
    });

    const res = await app.fetch(req, { DB: makeDb(), ...BASE_ENV });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/tenant/i);
  });

  it("returns 400 when userProfile.email is missing", async () => {
    const res = await app.fetch(
      makeDeprovisionRequest({ tenantId: TENANT_ID, userProfile: {} }),
      { DB: makeDb(), ...BASE_ENV },
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/email/i);
  });

  it("removes user from GitHub org and returns success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("search/users")) {
          return Promise.resolve(
            mockResponse(200, { total_count: 1, items: [{ login: GITHUB_USERNAME }] }),
          );
        }
        if (typeof url === "string" && url.includes(`/members/${GITHUB_USERNAME}`)) {
          return Promise.resolve(mockResponse(204));
        }
        return Promise.resolve(mockResponse(404));
      }),
    );

    const res = await app.fetch(
      makeDeprovisionRequest({
        tenantId: TENANT_ID,
        userProfile: { email: USER_EMAIL },
      }),
      { DB: makeDb(), ...BASE_ENV },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; status: string };
    expect(data.success).toBe(true);
    expect(data.status).toBe("deprovisioned");
  });

  it("returns 404 when GitHub user not found by email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(200, { total_count: 0, items: [] }),
      ),
    );

    const res = await app.fetch(
      makeDeprovisionRequest({
        tenantId: TENANT_ID,
        userProfile: { email: USER_EMAIL },
      }),
      { DB: makeDb(), ...BASE_ENV },
    );

    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/No GitHub account/i);
  });

  it("treats 404 on member removal as success (already removed)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("search/users")) {
          return Promise.resolve(
            mockResponse(200, { total_count: 1, items: [{ login: GITHUB_USERNAME }] }),
          );
        }
        // 404 on member removal = not a member
        return Promise.resolve(mockResponse(404, { message: "Not Found" }));
      }),
    );

    const res = await app.fetch(
      makeDeprovisionRequest({
        tenantId: TENANT_ID,
        userProfile: { email: USER_EMAIL },
      }),
      { DB: makeDb(), ...BASE_ENV },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean };
    expect(data.success).toBe(true);
  });
});
