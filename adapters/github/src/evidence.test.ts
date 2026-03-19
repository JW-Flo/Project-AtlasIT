import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import app from "./index.js";

const TENANT_ID = "tenant-test-123";
const ACCESS_TOKEN = "ghs_test_token";
const ORG_NAME = "test-org";

// Helper to build a mock D1 database
function makeDb(overrides: {
  tokenRow?: { access_token: string } | null;
  configRow?: { config: string } | null;
} = {}) {
  const tokenRow =
    "tokenRow" in overrides
      ? overrides.tokenRow
      : { access_token: ACCESS_TOKEN };
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

// Helper to build a test request
function makeRequest(body: Record<string, unknown> = { tenantId: TENANT_ID }) {
  return new Request("https://github-adapter.test/api/evidence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer internal-secret",
    },
    body: JSON.stringify(body),
  });
}

// Helper to build a mock org response
function makeOrgResponse(overrides: {
  two_factor_requirement_enabled?: boolean;
  saml_enabled?: boolean;
} = {}) {
  return {
    login: ORG_NAME,
    two_factor_requirement_enabled:
      overrides.two_factor_requirement_enabled ?? true,
    plan: { name: "business" },
  };
}

// Helper to build mock repos
function makeRepos(names: string[]) {
  return names.map((name) => ({ name, default_branch: "main" }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/evidence", () => {
  describe("response shape", () => {
    it("returns items with correct types and controlRefs when all checks pass", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/orgs/test-org") && !url.includes("/repos")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => makeOrgResponse({ two_factor_requirement_enabled: true }),
            });
          }
          if (url.includes("/repos?")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => makeRepos(["repo-a", "repo-b"]),
            });
          }
          // Branch protection calls
          if (url.includes("/branches/main")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({ protected: true }),
            });
          }
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        }),
      );

      const res = await app.fetch(makeRequest(), {
        DB: makeDb(),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "client-id",
        GITHUB_CLIENT_SECRET: "client-secret",
        GITHUB_WEBHOOK_SECRET: "webhook-secret",
        OAUTH2_REDIRECT_URI: "https://github-adapter.test/auth/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items).toHaveLength(3);

      const types = (data.items as Array<{ type: string }>).map((i) => i.type);
      expect(types).toContain("branch_protection");
      expect(types).toContain("mfa_enforcement");
      expect(types).toContain("sso_enforcement");

      const branchItem = (data.items as Array<{ type: string; controlRefs: string[] }>).find(
        (i) => i.type === "branch_protection",
      );
      expect(branchItem?.controlRefs).toEqual(["SOC2-CC8.1", "ISO-27001-A.12.6.1"]);

      const mfaItem = (data.items as Array<{ type: string; controlRefs: string[] }>).find(
        (i) => i.type === "mfa_enforcement",
      );
      expect(mfaItem?.controlRefs).toEqual([
        "SOC2-CC6.1",
        "ISO-27001-A.9.4.2",
        "HIPAA-164.312(d)",
      ]);

      const ssoItem = (data.items as Array<{ type: string; controlRefs: string[] }>).find(
        (i) => i.type === "sso_enforcement",
      );
      expect(ssoItem?.controlRefs).toEqual(["SOC2-CC6.1", "ISO-27001-A.9.2.1"]);
    });
  });

  describe("branch_protection", () => {
    it("returns pass when all repos have protected default branches", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/orgs/test-org") && !url.includes("/repos")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => makeOrgResponse(),
            });
          }
          if (url.includes("/repos?")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => makeRepos(["repo-a", "repo-b"]),
            });
          }
          if (url.includes("/branches/main")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({ protected: true }),
            });
          }
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        }),
      );

      const res = await app.fetch(makeRequest(), {
        DB: makeDb(),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "branch_protection");
      expect(item?.status).toBe("pass");
    });

    it("returns fail when some repos lack branch protection", async () => {
      let branchCallCount = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/orgs/test-org") && !url.includes("/repos")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => makeOrgResponse(),
            });
          }
          if (url.includes("/repos?")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => makeRepos(["repo-a", "repo-b"]),
            });
          }
          if (url.includes("/branches/main")) {
            branchCallCount++;
            // first repo protected, second not
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({ protected: branchCallCount === 1 }),
            });
          }
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        }),
      );

      const res = await app.fetch(makeRequest(), {
        DB: makeDb(),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "branch_protection");
      expect(item?.status).toBe("fail");
    });
  });

  describe("mfa_enforcement", () => {
    it("returns pass when org has two_factor_requirement_enabled: true", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/orgs/test-org") && !url.includes("/repos")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => makeOrgResponse({ two_factor_requirement_enabled: true }),
            });
          }
          if (url.includes("/repos?")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => [],
            });
          }
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        }),
      );

      const res = await app.fetch(makeRequest(), {
        DB: makeDb(),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "mfa_enforcement");
      expect(item?.status).toBe("pass");
    });

    it("returns fail when org has two_factor_requirement_enabled: false", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/orgs/test-org") && !url.includes("/repos")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => makeOrgResponse({ two_factor_requirement_enabled: false }),
            });
          }
          if (url.includes("/repos?")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => [],
            });
          }
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        }),
      );

      const res = await app.fetch(makeRequest(), {
        DB: makeDb(),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "mfa_enforcement");
      expect(item?.status).toBe("fail");
    });
  });

  describe("sso_enforcement", () => {
    it("returns pass when org has SAML SSO configured", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/orgs/test-org/credential-authorizations")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => [],
            });
          }
          if (url.includes("/orgs/test-org") && !url.includes("/repos")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                ...makeOrgResponse(),
                saml_sso_enabled: true,
                saml_sso_required: true,
              }),
            });
          }
          if (url.includes("/repos?")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => [],
            });
          }
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        }),
      );

      const res = await app.fetch(makeRequest(), {
        DB: makeDb(),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "sso_enforcement");
      expect(item?.status).toBe("pass");
    });

    it("returns unknown when org endpoint returns 403 (may need admin scope)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/orgs/test-org") && !url.includes("/repos")) {
            return Promise.resolve({
              ok: false,
              status: 403,
              json: async () => ({ message: "Resource not accessible by integration" }),
            });
          }
          if (url.includes("/repos?")) {
            return Promise.resolve({
              ok: false,
              status: 403,
              json: async () => ({ message: "Forbidden" }),
            });
          }
          return Promise.resolve({ ok: false, status: 403, json: async () => ({}) });
        }),
      );

      const res = await app.fetch(makeRequest(), {
        DB: makeDb(),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "sso_enforcement");
      expect(item?.status).toBe("unknown");
    });
  });

  describe("missing token/config", () => {
    it("returns empty items when no token found for tenant", async () => {
      const res = await app.fetch(makeRequest(), {
        DB: makeDb({ tokenRow: null }),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: unknown[] };
      expect(data.items).toEqual([]);
    });

    it("returns empty items when no config found for tenant", async () => {
      const res = await app.fetch(makeRequest(), {
        DB: makeDb({ configRow: null }),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: unknown[] };
      expect(data.items).toEqual([]);
    });
  });

  describe("GitHub API errors", () => {
    it("returns empty items when GitHub API returns errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ message: "Internal Server Error" }),
          }),
        ),
      );

      const res = await app.fetch(makeRequest(), {
        DB: makeDb(),
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "github",
        GITHUB_CLIENT_ID: "id",
        GITHUB_CLIENT_SECRET: "secret",
        GITHUB_WEBHOOK_SECRET: "secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
        EVENT_PUBLISH_SECRET: "",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: unknown[] };
      expect(data.items).toEqual([]);
    });
  });
});
