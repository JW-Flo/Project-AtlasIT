import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

// ---------------------------------------------------------------------------
// D1 mock helpers
// ---------------------------------------------------------------------------

function makeTokenRow(overrides: Record<string, unknown> = {}) {
  return {
    access_token: "graph-access-token",
    refresh_token: null,
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    ...overrides,
  };
}

function makeD1Mock(tokenRow: unknown) {
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => tokenRow,
        run: async () => ({ success: true }),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Env factory
// ---------------------------------------------------------------------------

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: makeD1Mock(makeTokenRow()),
    ADAPTER_SECRET: "test-secret",
    ORCHESTRATOR_URL: "https://orchestrator.example.com",
    ADAPTER_NAME: "microsoft-365",
    MICROSOFT_CLIENT_ID: "client-id",
    MICROSOFT_CLIENT_SECRET: "client-secret",
    OAUTH2_REDIRECT_URI: "https://example.com/callback",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/provision
// ---------------------------------------------------------------------------

describe("POST /api/provision — microsoft-365", () => {
  it("returns 400 when X-Tenant-ID header is missing", async () => {
    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/X-Tenant-ID/);
  });

  it("returns 400 when userProfile.email is missing", async () => {
    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: {} }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/email/);
  });

  it("returns 401 when no OAuth token is stored for the tenant", async () => {
    const env = makeEnv({ DB: makeD1Mock(null) });

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, env);
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/token/i);
  });

  it("successfully enables sign-in and returns provisioned status", async () => {
    const graphUser = { id: "aad-user-id-123", displayName: "Alice Smith" };

    vi.stubGlobal(
      "fetch",
      vi.fn()
        // First call: user lookup GET
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => graphUser,
          text: async () => JSON.stringify(graphUser),
        })
        // Second call: PATCH accountEnabled:true
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          text: async () => "",
        }),
    );

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    const body = await res.json() as {
      status: string;
      userId: string;
      email: string;
      displayName: string;
    };
    expect(body.status).toBe("provisioned");
    expect(body.userId).toBe("aad-user-id-123");
    expect(body.email).toBe("alice@example.com");
    expect(body.displayName).toBe("Alice Smith");
  });

  it("sends PATCH with accountEnabled:true to Graph API", async () => {
    const graphUser = { id: "aad-user-id-456", displayName: "Bob" };
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => graphUser,
        text: async () => JSON.stringify(graphUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => "",
      });

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "bob@example.com" } }),
    });

    await app.fetch(req, makeEnv());

    const patchCall = mockFetch.mock.calls[1];
    expect(patchCall[0]).toContain("aad-user-id-456");
    expect(patchCall[1].method).toBe("PATCH");
    const patchBody = JSON.parse(patchCall[1].body as string);
    expect(patchBody.accountEnabled).toBe(true);
  });

  it("returns 404 when user is not found in Microsoft 365 tenant", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: { code: "Request_ResourceNotFound" } }),
      }),
    );

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "nobody@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 502 when Graph API user lookup returns a non-404 error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: { code: "ServiceNotAvailable" } }),
      }),
    );

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/lookup failed/i);
  });

  it("returns 502 when the PATCH to enable account fails", async () => {
    const graphUser = { id: "aad-user-id-789", displayName: "Charlie" };

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => graphUser,
          text: async () => JSON.stringify(graphUser),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => JSON.stringify({ error: { code: "Authorization_RequestDenied" } }),
        }),
    );

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "charlie@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/enable/i);
  });
});

// ---------------------------------------------------------------------------
// POST /api/deprovision
// ---------------------------------------------------------------------------

describe("POST /api/deprovision — microsoft-365", () => {
  it("returns 400 when X-Tenant-ID header is missing", async () => {
    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/X-Tenant-ID/);
  });

  it("returns 400 when userProfile.email is missing", async () => {
    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: {} }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/email/);
  });

  it("returns 401 when no OAuth token is stored for the tenant", async () => {
    const env = makeEnv({ DB: makeD1Mock(null) });

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, env);
    expect(res.status).toBe(401);
  });

  it("successfully disables sign-in and revokes sessions", async () => {
    const graphUser = { id: "aad-user-id-999", displayName: "Dave" };

    vi.stubGlobal(
      "fetch",
      vi.fn()
        // Lookup GET
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => graphUser,
          text: async () => JSON.stringify(graphUser),
        })
        // PATCH accountEnabled:false
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          text: async () => "",
        })
        // POST revokeSignInSessions
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ value: true }),
        }),
    );

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "dave@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    const body = await res.json() as {
      status: string;
      userId: string;
      email: string;
    };
    expect(body.status).toBe("deprovisioned");
    expect(body.userId).toBe("aad-user-id-999");
    expect(body.email).toBe("dave@example.com");
  });

  it("sends PATCH with accountEnabled:false and calls revokeSignInSessions", async () => {
    const graphUser = { id: "aad-user-id-888" };
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => graphUser,
        text: async () => JSON.stringify(graphUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ value: true }),
      });

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "eve@example.com" } }),
    });

    await app.fetch(req, makeEnv());

    // Second call is the PATCH
    const patchCall = mockFetch.mock.calls[1];
    expect(patchCall[0]).toContain("aad-user-id-888");
    expect(patchCall[1].method).toBe("PATCH");
    const patchBody = JSON.parse(patchCall[1].body as string);
    expect(patchBody.accountEnabled).toBe(false);

    // Third call is revokeSignInSessions
    const revokeCall = mockFetch.mock.calls[2];
    expect(revokeCall[0]).toContain("revokeSignInSessions");
    expect(revokeCall[1].method).toBe("POST");
  });

  it("returns 404 when user is not found in Microsoft 365 tenant", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: { code: "Request_ResourceNotFound" } }),
      }),
    );

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "ghost@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 502 when Graph API user lookup returns a non-404 error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: { code: "ServiceUnavailable" } }),
      }),
    );

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/lookup failed/i);
  });

  it("returns 502 when the PATCH to disable account fails", async () => {
    const graphUser = { id: "aad-user-id-777" };

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => graphUser,
          text: async () => JSON.stringify(graphUser),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => JSON.stringify({ error: { code: "Authorization_RequestDenied" } }),
        }),
    );

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "frank@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/disable/i);
  });

  it("returns 502 when revokeSignInSessions call fails", async () => {
    const graphUser = { id: "aad-user-id-666" };

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => graphUser,
          text: async () => JSON.stringify(graphUser),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          text: async () => "",
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ error: { code: "InternalServerError" } }),
        }),
    );

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "grace@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/revoke/i);
  });
});
