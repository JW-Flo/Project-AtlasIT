import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

const TENANT_ID = "tenant-test-123";
const ACCESS_TOKEN = "jira_test_token";
const CLOUD_ID = "test-cloud-id-123";

// Helper to build a mock D1 database
function makeDb(
  overrides: {
    tokenRow?: { access_token: string } | null;
    configRow?: { config: string } | null;
  } = {},
) {
  const tokenRow = "tokenRow" in overrides ? overrides.tokenRow : { access_token: ACCESS_TOKEN };
  const configRow =
    "configRow" in overrides
      ? overrides.configRow
      : { config: JSON.stringify({ cloudId: CLOUD_ID }) };

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
function makeRequest() {
  return new Request("https://jira-adapter.test/api/evidence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer internal-secret",
      "X-Tenant-ID": TENANT_ID,
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/evidence", () => {
  describe("response shape", () => {
    it("returns empty items array when tenant has no token", async () => {
      const db = makeDb({ tokenRow: null });
      const env = {
        DB: db as unknown as D1Database,
        ADAPTER_SECRET: "test-secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "jira",
        JIRA_CLIENT_ID: "test-client",
        JIRA_CLIENT_SECRET: "test-secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
      };

      const res = await app.fetch(makeRequest(), env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(body.items).toEqual([]);
    });

    it("returns empty items array when tenant has no config", async () => {
      const db = makeDb({ configRow: null });
      const env = {
        DB: db as unknown as D1Database,
        ADAPTER_SECRET: "test-secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "jira",
        JIRA_CLIENT_ID: "test-client",
        JIRA_CLIENT_SECRET: "test-secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
      };

      const res = await app.fetch(makeRequest(), env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(body.items).toEqual([]);
    });

    it("returns items with correct structure when Jira API calls succeed", async () => {
      const db = makeDb();

      // Mock Jira API responses
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          // Project search
          if (url.includes("/project/search")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                values: [{ id: "1", key: "PROJ", name: "Test Project", isLast: true }],
                total: 1,
                isLast: true,
              }),
            });
          }
          // Project roles
          if (url.includes("/project/PROJ/role") && !url.includes("/role/")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                Administrators: "https://api.atlassian.com/roles/1",
                Developers: "https://api.atlassian.com/roles/2",
              }),
            });
          }
          // Audit records
          if (url.includes("/auditing/record")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                offset: 0,
                limit: 100,
                total: 5,
                records: [
                  {
                    id: 1,
                    created: "2024-01-01T00:00:00Z",
                    summary: "User added",
                    category: "user",
                  },
                  {
                    id: 2,
                    created: "2024-01-02T00:00:00Z",
                    summary: "Permission changed",
                    category: "security",
                  },
                ],
              }),
            });
          }
          // Issue search
          if (url.includes("/search")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                startAt: 0,
                maxResults: 50,
                total: 3,
                issues: [
                  {
                    id: "1",
                    key: "SEC-1",
                    self: "https://test.atlassian.net/rest/api/3/issue/1",
                    fields: {
                      summary: "Security vulnerability",
                      status: { name: "Done", id: "3" },
                      issuetype: { name: "Bug", id: "1" },
                      priority: { name: "High", id: "2" },
                      created: "2024-01-01T00:00:00Z",
                      updated: "2024-01-05T00:00:00Z",
                      project: { id: "1", key: "PROJ", name: "Test Project" },
                      labels: ["security", "vulnerability"],
                    },
                  },
                  {
                    id: "2",
                    key: "SEC-2",
                    self: "https://test.atlassian.net/rest/api/3/issue/2",
                    fields: {
                      summary: "Compliance requirement",
                      status: { name: "In Progress", id: "1" },
                      issuetype: { name: "Task", id: "2" },
                      created: "2024-01-02T00:00:00Z",
                      updated: "2024-01-06T00:00:00Z",
                      project: { id: "1", key: "PROJ", name: "Test Project" },
                      labels: ["compliance"],
                    },
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
        }),
      );

      const env = {
        DB: db as unknown as D1Database,
        ADAPTER_SECRET: "test-secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "jira",
        JIRA_CLIENT_ID: "test-client",
        JIRA_CLIENT_SECRET: "test-secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
      };

      const res = await app.fetch(makeRequest(), env);
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        items: Array<{
          type: string;
          controlRefs: string[];
          status: "pass" | "fail" | "unknown";
          details: Record<string, unknown>;
        }>;
      };

      expect(body.items).toBeDefined();
      expect(body.items.length).toBeGreaterThan(0);

      // Verify project permissions item
      const projectPermsItem = body.items.find((i) => i.type === "project_permissions");
      expect(projectPermsItem).toBeDefined();
      expect(projectPermsItem?.controlRefs).toContain("SOC2-CC6.1");
      expect(projectPermsItem?.status).toBe("pass");
      expect(projectPermsItem?.details).toHaveProperty("projectCount");

      // Verify audit log items
      const userEventsItem = body.items.find((i) => i.type === "audit_log_user_events");
      expect(userEventsItem).toBeDefined();
      expect(userEventsItem?.controlRefs).toContain("SOC2-CC6.3");
      expect(userEventsItem?.status).toBe("pass");

      const securityEventsItem = body.items.find((i) => i.type === "audit_log_security_events");
      expect(securityEventsItem).toBeDefined();
      expect(securityEventsItem?.controlRefs).toContain("SOC2-CC7.3");

      // Verify issue tracking items
      const vulnItem = body.items.find((i) => i.type === "vulnerability_tracking");
      expect(vulnItem).toBeDefined();
      expect(vulnItem?.controlRefs).toContain("ISO-27001-A.12.6.1");

      const incidentItem = body.items.find((i) => i.type === "security_incident_tracking");
      expect(incidentItem).toBeDefined();
      expect(incidentItem?.controlRefs).toContain("SOC2-CC7.3");
      expect(incidentItem?.controlRefs).toContain("ISO-27001-A.12.1.1");
    });

    it("handles API failures gracefully and returns unknown status", async () => {
      const db = makeDb();

      // Mock failing Jira API responses
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => {
          return Promise.resolve({
            ok: false,
            status: 403,
            text: async () => "Forbidden",
            json: async () => ({ error: "Forbidden" }),
          });
        }),
      );

      const env = {
        DB: db as unknown as D1Database,
        ADAPTER_SECRET: "test-secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "jira",
        JIRA_CLIENT_ID: "test-client",
        JIRA_CLIENT_SECRET: "test-secret",
        OAUTH2_REDIRECT_URI: "https://test/callback",
      };

      const res = await app.fetch(makeRequest(), env);
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        items: Array<{
          type: string;
          controlRefs: string[];
          status: "pass" | "fail" | "unknown";
          details: Record<string, unknown>;
        }>;
      };

      // Should still return empty items array on complete failure
      expect(body.items).toEqual([]);
    });
  });
});
