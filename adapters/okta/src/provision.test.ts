import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

const TENANT_ID = "tenant-test-okta";
const OKTA_USER_ID = "00u1234567890abcdef";
const USER_EMAIL = "alice@example.com";

const BASE_ENV = {
  OKTA_ORG_URL: "https://example.okta.com",
  OKTA_API_TOKEN: "test-ssws-token",
  OKTA_WEBHOOK_SECRET: "webhook-secret",
  ORCHESTRATOR_URL: "https://orchestrator.test",
  CONNECTOR_ID: "okta",
  SCIM_API_TOKEN: "scim-token",
  DB: {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({}),
    }),
  },
};

function makeRequest(
  endpoint: "/api/provision" | "/api/deprovision",
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return new Request(`https://okta-adapter.test${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": TENANT_ID,
      Authorization: "Bearer test-token",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/provision", () => {
  it("returns 400 when X-Tenant-ID header is missing", async () => {
    const req = new Request("https://okta-adapter.test/api/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-token" },
      body: JSON.stringify({ userProfile: { email: USER_EMAIL } }),
    });
    const res = await app.fetch(req, BASE_ENV);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/Tenant/i);
  });

  it("returns 400 when userProfile is missing", async () => {
    const res = await app.fetch(
      makeRequest("/api/provision", {}),
      BASE_ENV,
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/userProfile/i);
  });

  it("returns 400 when email is missing", async () => {
    const res = await app.fetch(
      makeRequest("/api/provision", { userProfile: { firstName: "Alice" } }),
      BASE_ENV,
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/email/i);
  });

  it("creates user via Okta API and returns provisioned status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: OKTA_USER_ID,
          status: "ACTIVE",
          profile: { email: USER_EMAIL, login: USER_EMAIL },
        }),
        text: async () => "{}",
      }),
    );

    const res = await app.fetch(
      makeRequest("/api/provision", {
        userProfile: { email: USER_EMAIL, firstName: "Alice", lastName: "Smith" },
      }),
      BASE_ENV,
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; oktaUserId: string };
    expect(data.status).toBe("provisioned");
    expect(data.oktaUserId).toBe(OKTA_USER_ID);
  });

  it("calls correct Okta endpoint with SSWS auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: OKTA_USER_ID }),
      text: async () => "{}",
    });
    vi.stubGlobal("fetch", fetchMock);

    await app.fetch(
      makeRequest("/api/provision", {
        userProfile: { email: USER_EMAIL },
      }),
      BASE_ENV,
    );

    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.okta.com/api/v1/users?activate=true");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("SSWS test-ssws-token");
  });

  it("returns provisioned (idempotent) when Okta returns E0000001 (user already exists)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errorCode: "E0000001" }),
        text: async () => "E0000001",
      }),
    );

    const res = await app.fetch(
      makeRequest("/api/provision", {
        userProfile: { email: USER_EMAIL },
      }),
      BASE_ENV,
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; note: string };
    expect(data.status).toBe("provisioned");
    expect(data.note).toMatch(/already exists/i);
  });

  it("returns error when Okta API returns non-ok status (non-E0000001)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errorCode: "E0000006" }),
        text: async () => "Bad Request E0000006",
      }),
    );

    const res = await app.fetch(
      makeRequest("/api/provision", {
        userProfile: { email: USER_EMAIL },
      }),
      BASE_ENV,
    );

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/Okta API error/i);
  });
});

describe("POST /api/deprovision", () => {
  it("returns 400 when X-Tenant-ID header is missing", async () => {
    const req = new Request("https://okta-adapter.test/api/deprovision", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-token" },
      body: JSON.stringify({ userProfile: { email: USER_EMAIL } }),
    });
    const res = await app.fetch(req, BASE_ENV);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/Tenant/i);
  });

  it("returns 400 when userProfile is missing", async () => {
    const res = await app.fetch(
      makeRequest("/api/deprovision", {}),
      BASE_ENV,
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/userProfile/i);
  });

  it("returns 400 when email is missing", async () => {
    const res = await app.fetch(
      makeRequest("/api/deprovision", { userProfile: { firstName: "Alice" } }),
      BASE_ENV,
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/email/i);
  });

  it("deactivates user when found and returns deprovisioned status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        // First call: user search
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [{ id: OKTA_USER_ID, status: "ACTIVE" }],
          text: async () => "[]",
        })
        // Second call: deactivate lifecycle
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({}),
          text: async () => "{}",
        }),
    );

    const res = await app.fetch(
      makeRequest("/api/deprovision", {
        userProfile: { email: USER_EMAIL },
      }),
      BASE_ENV,
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; oktaUserId: string };
    expect(data.status).toBe("deprovisioned");
    expect(data.oktaUserId).toBe(OKTA_USER_ID);
  });

  it("returns deprovisioned when user not found in Okta (idempotent)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [], // empty array = no users found
        text: async () => "[]",
      }),
    );

    const res = await app.fetch(
      makeRequest("/api/deprovision", {
        userProfile: { email: USER_EMAIL },
      }),
      BASE_ENV,
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; note: string };
    expect(data.status).toBe("deprovisioned");
    expect(data.note).toMatch(/not found/i);
  });

  it("returns error when Okta lookup API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
        text: async () => "Internal Server Error",
      }),
    );

    const res = await app.fetch(
      makeRequest("/api/deprovision", {
        userProfile: { email: USER_EMAIL },
      }),
      BASE_ENV,
    );

    expect(res.status).toBe(502);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/Okta API error/i);
  });

  it("returns error when deactivation call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [{ id: OKTA_USER_ID }],
          text: async () => "[]",
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ errorSummary: "Forbidden" }),
          text: async () => "Forbidden",
        }),
    );

    const res = await app.fetch(
      makeRequest("/api/deprovision", {
        userProfile: { email: USER_EMAIL },
      }),
      BASE_ENV,
    );

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/Okta API error/i);
  });
});
