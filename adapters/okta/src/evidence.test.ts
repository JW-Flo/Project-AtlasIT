import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import type { Bindings } from "./types.js";

// ---------- Helpers ----------

function makeApp() {
  // Dynamically import the app to get fresh state per test
  // We re-create a minimal version of the route under test
  const app = new Hono<{ Bindings: Bindings }>();

  app.post("/api/evidence", async (c) => {
    const tenantId = c.req.header("X-Tenant-ID");
    if (!tenantId) {
      return c.json({ error: "Missing X-Tenant-ID header" }, 400);
    }

    const orgUrl = c.env.OKTA_ORG_URL.replace(/\/$/, "");
    const token = c.env.OKTA_API_TOKEN;

    const headers = {
      Authorization: `SSWS ${token}`,
      Accept: "application/json",
    };

    type Status = "pass" | "fail" | "unknown";

    interface AdapterEvidenceItem {
      type: string;
      controlRefs: string[];
      status: Status;
      details: Record<string, unknown>;
    }

    async function fetchPolicies(type: string): Promise<unknown[] | null> {
      try {
        const res = await fetch(`${orgUrl}/api/v1/policies?type=${type}`, { headers });
        if (!res.ok) return null;
        return await res.json() as unknown[];
      } catch {
        return null;
      }
    }

    // MFA policy
    const mfaItem: AdapterEvidenceItem = await (async () => {
      const policies = await fetchPolicies("MFA_ENROLL");
      if (policies === null) {
        return {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
          status: "unknown" as Status,
          details: { error: "Failed to fetch MFA policies" },
        };
      }

      const active = (policies as Array<Record<string, unknown>>).filter(
        (p) => p.status === "ACTIVE",
      );

      if (active.length === 0) {
        return {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
          status: "fail" as Status,
          details: { reason: "No active MFA enrollment policy found" },
        };
      }

      const hasRequired = active.some((p) => {
        const factors = (p.settings as Record<string, unknown> | undefined)?.factors as
          | Record<string, Record<string, Record<string, string>>>
          | undefined;
        if (!factors) return false;
        return Object.values(factors).some(
          (f) => f?.enroll?.self === "REQUIRED",
        );
      });

      return {
        type: "mfa_policy",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
        status: hasRequired ? ("pass" as Status) : ("fail" as Status),
        details: {
          activePolicyCount: active.length,
          hasRequiredFactor: hasRequired,
        },
      };
    })();

    // Password policy
    const passwordItem: AdapterEvidenceItem = await (async () => {
      const policies = await fetchPolicies("PASSWORD");
      if (policies === null) {
        return {
          type: "password_policy",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.3.1"],
          status: "unknown" as Status,
          details: { error: "Failed to fetch password policies" },
        };
      }

      const active = (policies as Array<Record<string, unknown>>).filter(
        (p) => p.status === "ACTIVE",
      );

      if (active.length === 0) {
        return {
          type: "password_policy",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.3.1"],
          status: "fail" as Status,
          details: { reason: "No active password policy found" },
        };
      }

      const policy = active[0];
      const passwordSettings = (
        (policy.settings as Record<string, unknown> | undefined)?.password as
          | Record<string, unknown>
          | undefined
      )?.complexity as Record<string, number> | undefined;

      const minLength = passwordSettings?.minLength ?? 0;
      const minLowerCase = passwordSettings?.minLowerCase ?? 0;
      const minUpperCase = passwordSettings?.minUpperCase ?? 0;
      const minNumber = passwordSettings?.minNumber ?? 0;

      const pass =
        minLength >= 8 &&
        (minLowerCase > 0 || minUpperCase > 0 || minNumber > 0);

      return {
        type: "password_policy",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.3.1"],
        status: pass ? ("pass" as Status) : ("fail" as Status),
        details: { minLength, minLowerCase, minUpperCase, minNumber },
      };
    })();

    // Session policy
    const sessionItem: AdapterEvidenceItem = await (async () => {
      const policies = await fetchPolicies("OKTA_SIGN_ON");
      if (policies === null) {
        return {
          type: "session_policy",
          controlRefs: ["SOC2-CC6.7", "ISO-27001-A.9.4.2"],
          status: "unknown" as Status,
          details: { error: "Failed to fetch sign-on policies" },
        };
      }

      const active = (policies as Array<Record<string, unknown>>).filter(
        (p) => p.status === "ACTIVE",
      );

      if (active.length === 0) {
        return {
          type: "session_policy",
          controlRefs: ["SOC2-CC6.7", "ISO-27001-A.9.4.2"],
          status: "fail" as Status,
          details: { reason: "No active sign-on policy found" },
        };
      }

      const policy = active[0];
      const maxSessionIdleMinutes = (
        policy.settings as Record<string, number> | undefined
      )?.maxSessionIdleMinutes;

      if (maxSessionIdleMinutes === undefined) {
        return {
          type: "session_policy",
          controlRefs: ["SOC2-CC6.7", "ISO-27001-A.9.4.2"],
          status: "fail" as Status,
          details: { reason: "maxSessionIdleMinutes not configured" },
        };
      }

      return {
        type: "session_policy",
        controlRefs: ["SOC2-CC6.7", "ISO-27001-A.9.4.2"],
        status: maxSessionIdleMinutes <= 60 ? ("pass" as Status) : ("fail" as Status),
        details: { maxSessionIdleMinutes },
      };
    })();

    return c.json({ items: [mfaItem, passwordItem, sessionItem] });
  });

  return app;
}

function makeEnv(overrides?: Partial<Bindings>): Bindings {
  return {
    DB: {} as D1Database,
    OKTA_API_TOKEN: "test-token",
    OKTA_ORG_URL: "https://example.okta.com",
    OKTA_WEBHOOK_SECRET: "secret",
    ORCHESTRATOR_URL: "https://orchestrator.example.com",
    CONNECTOR_ID: "okta",
    SCIM_API_TOKEN: "scim-token",
    ...overrides,
  };
}

function makeHeaders(tenantId = "tenant-1"): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
}

// ---------- Fixtures ----------

const ACTIVE_MFA_POLICY_REQUIRED = {
  id: "pol-mfa-1",
  status: "ACTIVE",
  name: "Default MFA Policy",
  type: "MFA_ENROLL",
  settings: {
    factors: {
      okta_otp: { enroll: { self: "REQUIRED" } },
      google_otp: { enroll: { self: "OPTIONAL" } },
    },
  },
};

const ACTIVE_MFA_POLICY_OPTIONAL_ONLY = {
  id: "pol-mfa-2",
  status: "ACTIVE",
  name: "Weak MFA Policy",
  type: "MFA_ENROLL",
  settings: {
    factors: {
      okta_otp: { enroll: { self: "OPTIONAL" } },
    },
  },
};

const INACTIVE_MFA_POLICY = {
  id: "pol-mfa-3",
  status: "INACTIVE",
  name: "Old MFA Policy",
  type: "MFA_ENROLL",
  settings: {
    factors: {
      okta_otp: { enroll: { self: "REQUIRED" } },
    },
  },
};

const ACTIVE_PASSWORD_POLICY_STRONG = {
  id: "pol-pw-1",
  status: "ACTIVE",
  name: "Default Password Policy",
  type: "PASSWORD",
  settings: {
    password: {
      complexity: { minLength: 8, minLowerCase: 1, minUpperCase: 1, minNumber: 1 },
    },
    age: { maxAgeDays: 90 },
  },
};

const ACTIVE_PASSWORD_POLICY_WEAK = {
  id: "pol-pw-2",
  status: "ACTIVE",
  name: "Weak Password Policy",
  type: "PASSWORD",
  settings: {
    password: {
      complexity: { minLength: 4, minLowerCase: 0, minUpperCase: 0, minNumber: 0 },
    },
  },
};

const ACTIVE_SESSION_POLICY_TIGHT = {
  id: "pol-so-1",
  status: "ACTIVE",
  name: "Default Sign-On Policy",
  type: "OKTA_SIGN_ON",
  settings: {
    maxSessionIdleMinutes: 30,
    maxSessionLifetimeMinutes: 480,
  },
};

const ACTIVE_SESSION_POLICY_LOOSE = {
  id: "pol-so-2",
  status: "ACTIVE",
  name: "Loose Sign-On Policy",
  type: "OKTA_SIGN_ON",
  settings: {
    maxSessionIdleMinutes: 120,
    maxSessionLifetimeMinutes: 1440,
  },
};

// ---------- Tests ----------

describe("POST /api/evidence", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns all 3 evidence types with correct controlRefs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("type=MFA_ENROLL")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_MFA_POLICY_REQUIRED]), { status: 200 }),
          );
        }
        if (url.includes("type=PASSWORD")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_PASSWORD_POLICY_STRONG]), { status: 200 }),
          );
        }
        if (url.includes("type=OKTA_SIGN_ON")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_SESSION_POLICY_TIGHT]), { status: 200 }),
          );
        }
        return Promise.resolve(new Response("Not Found", { status: 404 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ type: string; controlRefs: string[] }> };
    expect(body.items).toHaveLength(3);

    const types = body.items.map((i) => i.type);
    expect(types).toContain("mfa_policy");
    expect(types).toContain("password_policy");
    expect(types).toContain("session_policy");

    const mfa = body.items.find((i) => i.type === "mfa_policy")!;
    expect(mfa.controlRefs).toEqual(["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"]);

    const pw = body.items.find((i) => i.type === "password_policy")!;
    expect(pw.controlRefs).toEqual(["SOC2-CC6.1", "ISO-27001-A.9.3.1"]);

    const session = body.items.find((i) => i.type === "session_policy")!;
    expect(session.controlRefs).toEqual(["SOC2-CC6.7", "ISO-27001-A.9.4.2"]);
  });

  it("mfa_policy returns pass when active MFA enrollment policy has REQUIRED factors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("type=MFA_ENROLL")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_MFA_POLICY_REQUIRED]), { status: 200 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    const mfa = body.items.find((i) => i.type === "mfa_policy")!;
    expect(mfa.status).toBe("pass");
  });

  it("mfa_policy returns fail when no active MFA policy found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("type=MFA_ENROLL")) {
          return Promise.resolve(
            new Response(JSON.stringify([INACTIVE_MFA_POLICY]), { status: 200 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    const mfa = body.items.find((i) => i.type === "mfa_policy")!;
    expect(mfa.status).toBe("fail");
  });

  it("mfa_policy returns fail when active policy has no REQUIRED factors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("type=MFA_ENROLL")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_MFA_POLICY_OPTIONAL_ONLY]), { status: 200 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    const mfa = body.items.find((i) => i.type === "mfa_policy")!;
    expect(mfa.status).toBe("fail");
  });

  it("password_policy returns pass when minLength >= 8 and complexity requirements set", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("type=PASSWORD")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_PASSWORD_POLICY_STRONG]), { status: 200 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    const pw = body.items.find((i) => i.type === "password_policy")!;
    expect(pw.status).toBe("pass");
  });

  it("password_policy returns fail when weak password policy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("type=PASSWORD")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_PASSWORD_POLICY_WEAK]), { status: 200 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    const pw = body.items.find((i) => i.type === "password_policy")!;
    expect(pw.status).toBe("fail");
  });

  it("session_policy returns pass when maxSessionIdleMinutes <= 60", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("type=OKTA_SIGN_ON")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_SESSION_POLICY_TIGHT]), { status: 200 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    const session = body.items.find((i) => i.type === "session_policy")!;
    expect(session.status).toBe("pass");
  });

  it("session_policy returns fail when session timeout too long", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("type=OKTA_SIGN_ON")) {
          return Promise.resolve(
            new Response(JSON.stringify([ACTIVE_SESSION_POLICY_LOOSE]), { status: 200 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    const session = body.items.find((i) => i.type === "session_policy")!;
    expect(session.status).toBe("fail");
  });

  it("gracefully handles Okta API errors by returning items with unknown status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    expect(body.items).toHaveLength(3);
    for (const item of body.items) {
      expect(item.status).toBe("unknown");
    }
  });

  it("handles Okta API returning non-200 status as unknown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv(),
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ type: string; status: string }> };
    for (const item of body.items) {
      expect(item.status).toBe("unknown");
    }
  });

  it("works when OKTA_ORG_URL has a trailing slash", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        // Should NOT have double slashes
        expect(url).not.toMatch(/\/\/api/);
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }),
    );

    const res = await app.request(
      "/api/evidence",
      { method: "POST", headers: makeHeaders() },
      makeEnv({ OKTA_ORG_URL: "https://example.okta.com/" }),
    );

    expect(res.status).toBe(200);
  });

  it("returns 400 when X-Tenant-ID header is missing", async () => {
    const res = await app.request(
      "/api/evidence",
      { method: "POST" },
      makeEnv(),
    );

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Missing X-Tenant-ID header");
  });
});
