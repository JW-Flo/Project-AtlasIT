import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

// ---------------------------------------------------------------------------
// D1 mock helpers
// ---------------------------------------------------------------------------

function makeD1Mock(row: unknown) {
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => row,
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Env factory
// ---------------------------------------------------------------------------

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: makeD1Mock(null),
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
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/evidence — microsoft-365", () => {
  it("returns empty items when no token is stored for the tenant", async () => {
    const env = makeEnv({ DB: makeD1Mock(null) });

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json() as { items: unknown[] };
    expect(body.items).toEqual([]);
  });

  it("returns pass for mfa_enforcement when an enabled CA policy requires MFA", async () => {
    const token = { access_token: "tok123" };
    const env = makeEnv({ DB: makeD1Mock(token) });

    const graphResponse = {
      value: [
        {
          state: "enabled",
          grantControls: { builtInControls: ["mfa"] },
        },
        {
          state: "disabled",
          grantControls: { builtInControls: [] },
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => graphResponse,
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ type: string; status: string }> };

    const mfa = body.items.find((i) => i.type === "mfa_enforcement");
    expect(mfa?.status).toBe("pass");
  });

  it("returns fail for mfa_enforcement when no enabled CA policy requires MFA", async () => {
    const token = { access_token: "tok123" };
    const env = makeEnv({ DB: makeD1Mock(token) });

    const graphResponse = {
      value: [
        {
          state: "enabled",
          grantControls: { builtInControls: ["compliantDevice"] },
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => graphResponse,
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, env);
    const body = await res.json() as { items: Array<{ type: string; status: string }> };

    const mfa = body.items.find((i) => i.type === "mfa_enforcement");
    expect(mfa?.status).toBe("fail");
  });

  it("returns correct controlRefs for all evidence items", async () => {
    const token = { access_token: "tok123" };
    const env = makeEnv({ DB: makeD1Mock(token) });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ value: [] }),
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, env);
    const body = await res.json() as { items: Array<{ type: string; controlRefs: string[] }> };

    const mfa = body.items.find((i) => i.type === "mfa_enforcement");
    expect(mfa?.controlRefs).toEqual(
      expect.arrayContaining(["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"]),
    );

    const ca = body.items.find((i) => i.type === "conditional_access");
    expect(ca?.controlRefs).toEqual(
      expect.arrayContaining(["SOC2-CC6.1", "ISO-27001-A.9.4.1"]),
    );

    const enc = body.items.find((i) => i.type === "encryption_status");
    expect(enc?.controlRefs).toEqual(
      expect.arrayContaining(["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"]),
    );
  });

  it("returns unknown status for all items when Graph API call fails", async () => {
    const token = { access_token: "tok123" };
    const env = makeEnv({ DB: makeD1Mock(token) });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Unauthorized" } }),
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, env);
    const body = await res.json() as { items: Array<{ status: string }> };

    expect(body.items.every((i) => i.status === "unknown")).toBe(true);
  });

  it("reads tenantId from X-Tenant-ID header when not in body", async () => {
    const token = { access_token: "tok-header" };
    const env = makeEnv({ DB: makeD1Mock(token) });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ value: [] }),
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-from-header",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({}),
    });

    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
  });
});
