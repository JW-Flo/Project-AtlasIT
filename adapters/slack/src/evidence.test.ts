import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

// ---------------------------------------------------------------------------
// Env factory
// ---------------------------------------------------------------------------

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          run: async () => ({ success: true }),
          all: async () => ({ results: [] }),
        }),
      }),
    },
    ADAPTER_SECRET: "test-secret",
    ORCHESTRATOR_URL: "https://orchestrator.example.com",
    ADAPTER_NAME: "slack",
    SLACK_CLIENT_ID: "client-id",
    SLACK_CLIENT_SECRET: "client-secret",
    SLACK_SIGNING_SECRET: "",
    SLACK_BOT_TOKEN: "xoxb-test-token",
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

describe("POST /api/evidence — slack", () => {
  it("returns two evidence items covering sso_enforcement and retention_policy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          team: { id: "T123", name: "Acme", enterprise_id: "E123" },
        }),
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

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    const body = await res.json() as { items: Array<{ type: string }> };
    const types = body.items.map((i) => i.type);
    expect(types).toContain("sso_enforcement");
    expect(types).toContain("retention_policy");
  });

  it("returns pass for sso_enforcement when team has enterprise_id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          team: { id: "T123", name: "Acme Corp", enterprise_id: "E123" },
        }),
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

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as { items: Array<{ type: string; status: string }> };

    const sso = body.items.find((i) => i.type === "sso_enforcement");
    expect(sso?.status).toBe("pass");
  });

  it("returns unknown for sso_enforcement when team has no enterprise_id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          team: { id: "T123", name: "Small Team", enterprise_id: null },
        }),
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

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as { items: Array<{ type: string; status: string }> };

    const sso = body.items.find((i) => i.type === "sso_enforcement");
    expect(sso?.status).toBe("unknown");
  });

  it("retention_policy always returns unknown with reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          team: { id: "T123", name: "Acme", enterprise_id: "E123" },
        }),
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

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as {
      items: Array<{ type: string; status: string; details: Record<string, unknown> }>;
    };

    const ret = body.items.find((i) => i.type === "retention_policy");
    expect(ret?.status).toBe("unknown");
    expect(typeof ret?.details["reason"]).toBe("string");
  });

  it("returns all unknown items when Slack API call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
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

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ status: string }> };
    expect(body.items.every((i) => i.status === "unknown")).toBe(true);
  });

  it("returns correct controlRefs for each evidence type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          team: { id: "T123", name: "Acme", enterprise_id: "E123" },
        }),
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

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as {
      items: Array<{ type: string; controlRefs: string[] }>;
    };

    const sso = body.items.find((i) => i.type === "sso_enforcement");
    expect(sso?.controlRefs).toEqual(
      expect.arrayContaining(["SOC2-CC6.1", "ISO-27001-A.9.2.1"]),
    );

    const ret = body.items.find((i) => i.type === "retention_policy");
    expect(ret?.controlRefs).toEqual(
      expect.arrayContaining(["GDPR-Art.5(1)(e)", "SOC2-CC6.6"]),
    );
  });
});
