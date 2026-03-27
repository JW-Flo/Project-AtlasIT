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

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function provisionRequest(body: Record<string, unknown>, tenantId?: string) {
  // tenantId is read from X-Tenant-ID header; extract it from body if provided there
  const { tenantId: bodyTenantId, ...bodyWithoutTenant } = body as { tenantId?: string } & Record<string, unknown>;
  const resolvedTenantId = tenantId ?? bodyTenantId;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: "Bearer test",
  };
  if (resolvedTenantId !== undefined) headers["X-Tenant-ID"] = resolvedTenantId;
  return new Request("http://localhost/api/provision", {
    method: "POST",
    headers,
    body: JSON.stringify(bodyWithoutTenant),
  });
}

function deprovisionRequest(body: Record<string, unknown>, tenantId?: string) {
  // tenantId is read from X-Tenant-ID header; extract it from body if provided there
  const { tenantId: bodyTenantId, ...bodyWithoutTenant } = body as { tenantId?: string } & Record<string, unknown>;
  const resolvedTenantId = tenantId ?? bodyTenantId;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: "Bearer test",
  };
  if (resolvedTenantId !== undefined) headers["X-Tenant-ID"] = resolvedTenantId;
  return new Request("http://localhost/api/deprovision", {
    method: "POST",
    headers,
    body: JSON.stringify(bodyWithoutTenant),
  });
}

const baseUserProfile = {
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Smith",
  groups: [],
  appAccess: [],
  rawAttributes: {},
};

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/provision
// ---------------------------------------------------------------------------

describe("POST /api/provision", () => {
  it("returns 400 when tenantId is missing", async () => {
    const res = await app.fetch(
      provisionRequest({ userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/X-Tenant-ID/i);
  });

  it("returns 400 when userProfile.email is missing", async () => {
    const res = await app.fetch(
      provisionRequest({
        tenantId: "tenant-1",
        userProfile: { groups: [], appAccess: [], rawAttributes: {} },
      }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/email/i);
  });

  it("returns 502 when team.info returns ok=false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: false, error: "team_not_found" }),
      }),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/team info/i);
  });

  it("returns 502 when team.info fetch throws a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/team\.info/i);
  });

  it("returns provisioned status on successful invite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        // team.info
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
        })
        // admin.users.invite
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true }),
        }),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as {
      status: string;
      tenantId: string;
      email: string;
    };
    expect(body.status).toBe("provisioned");
    expect(body.tenantId).toBe("tenant-1");
    expect(body.email).toBe("alice@example.com");
  });

  it("includes firstName and lastName in invite params when provided", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );

    const inviteCall = fetchMock.mock.calls[1];
    const inviteBody = inviteCall[1].body as string;
    expect(inviteBody).toContain("first_name=Alice");
    expect(inviteBody).toContain("last_name=Smith");
    expect(inviteBody).toContain("team_id=T123");
    expect(inviteBody).toContain("email=alice%40example.com");
  });

  it("falls back to pending_manual when invite fails with enterprise_only", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: false, error: "enterprise_only" }),
        }),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; reason: string };
    expect(body.status).toBe("pending_manual");
    expect(body.reason).toMatch(/Enterprise Grid/i);
  });

  it("falls back to pending_manual when invite fails with not_allowed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: false, error: "not_allowed" }),
        }),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("pending_manual");
  });

  it("falls back to pending_manual when invite fails with missing_scope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: false, error: "missing_scope" }),
        }),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("pending_manual");
  });

  it("falls back to pending_manual when invite fails with not_supported", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: false, error: "not_supported" }),
        }),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("pending_manual");
  });

  it("returns 502 when invite fails with an unexpected Slack error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: false, error: "invalid_email" }),
        }),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/invalid_email/);
  });

  it("returns 500 when admin.users.invite throws a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
        })
        .mockRejectedValueOnce(new Error("Connection refused")),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Connection refused");
  });

  it("pending_manual response includes email and tenantId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, team: { id: "T123", name: "Acme" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: false, error: "enterprise_only" }),
        }),
    );

    const res = await app.fetch(
      provisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    const body = await res.json() as {
      status: string;
      email: string;
      tenantId: string;
    };
    expect(body.email).toBe("alice@example.com");
    expect(body.tenantId).toBe("tenant-1");
  });
});

// ---------------------------------------------------------------------------
// POST /api/deprovision
// ---------------------------------------------------------------------------

describe("POST /api/deprovision", () => {
  it("returns 400 when tenantId is missing", async () => {
    const res = await app.fetch(
      deprovisionRequest({ userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/X-Tenant-ID/i);
  });

  it("returns 400 when userProfile.email is missing", async () => {
    const res = await app.fetch(
      deprovisionRequest({
        tenantId: "tenant-1",
        userProfile: { groups: [], appAccess: [], rawAttributes: {} },
      }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/email/i);
  });

  it("returns deprovisioned when user is not found in Slack (users_not_found)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: false, error: "users_not_found" }),
      }),
    );

    const res = await app.fetch(
      deprovisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as {
      status: string;
      reason: string;
      email: string;
    };
    expect(body.status).toBe("deprovisioned");
    expect(body.reason).toMatch(/not found/i);
    expect(body.email).toBe("alice@example.com");
  });

  it("returns 502 when lookupByEmail fails with an unexpected Slack error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: false, error: "ratelimited" }),
      }),
    );

    const res = await app.fetch(
      deprovisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/ratelimited/);
  });

  it("returns 502 when lookupByEmail fetch throws a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("DNS failure")));

    const res = await app.fetch(
      deprovisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/lookup/i);
  });

  it("returns deprovisioned with slackUserId on successful removal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        // users.lookupByEmail
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ok: true,
            user: { id: "U456", team_id: "T123" },
          }),
        })
        // admin.users.remove
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true }),
        }),
    );

    const res = await app.fetch(
      deprovisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as {
      status: string;
      tenantId: string;
      email: string;
      slackUserId: string;
    };
    expect(body.status).toBe("deprovisioned");
    expect(body.tenantId).toBe("tenant-1");
    expect(body.email).toBe("alice@example.com");
    expect(body.slackUserId).toBe("U456");
  });

  it("sends correct user_id and team_id to admin.users.remove", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          user: { id: "U456", team_id: "T123" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await app.fetch(
      deprovisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );

    const removeCall = fetchMock.mock.calls[1];
    const removeBody = removeCall[1].body as string;
    expect(removeBody).toContain("user_id=U456");
    expect(removeBody).toContain("team_id=T123");
  });

  it("returns 502 when admin.users.remove returns ok=false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ok: true,
            user: { id: "U456", team_id: "T123" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: false, error: "user_not_in_team" }),
        }),
    );

    const res = await app.fetch(
      deprovisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/user_not_in_team/);
  });

  it("returns 500 when admin.users.remove throws a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ok: true,
            user: { id: "U456", team_id: "T123" },
          }),
        })
        .mockRejectedValueOnce(new Error("Upstream timeout")),
    );

    const res = await app.fetch(
      deprovisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Upstream timeout");
  });

  it("passes email correctly to users.lookupByEmail URL", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          user: { id: "U456", team_id: "T123" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await app.fetch(
      deprovisionRequest({ tenantId: "tenant-1", userProfile: baseUserProfile }),
      makeEnv(),
    );

    const lookupUrl = fetchMock.mock.calls[0][0] as string;
    expect(lookupUrl).toContain("users.lookupByEmail");
    expect(lookupUrl).toContain(encodeURIComponent("alice@example.com"));
  });
});
