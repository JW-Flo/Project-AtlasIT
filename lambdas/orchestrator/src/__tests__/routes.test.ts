import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

const mockSessionRepo = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
const mockCacheRepo = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
const mockFlagRepo = { get: vi.fn(), isEnabled: vi.fn() };
const mockAuditRepo = { log: vi.fn(), list: vi.fn() };
const mockTenantRepo = { getById: vi.fn(), listUsers: vi.fn() };
const mockEvidenceRepo = { put: vi.fn(), get: vi.fn(), list: vi.fn() };
const mockQueueRepo = { send: vi.fn() };
const mockAuthRepo = { validateSession: vi.fn(), validateApiKey: vi.fn() };

vi.mock("@atlasit/shared/platform/aws/bootstrap.js", () => ({
  bootstrap: () => ({
    sessionRepo: mockSessionRepo,
    cacheRepo: mockCacheRepo,
    flagRepo: mockFlagRepo,
    auditRepo: mockAuditRepo,
    tenantRepo: mockTenantRepo,
    evidenceRepo: mockEvidenceRepo,
    queueRepo: mockQueueRepo,
    authRepo: mockAuthRepo,
  }),
}));

vi.mock("pg", () => {
  const mockQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  return { default: { Pool: vi.fn(() => ({ query: mockQuery })) } };
});

import { handler } from "../handler.js";

function makeEvent(method: string, path: string, opts?: Partial<APIGatewayProxyEventV2>): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: `${method} ${path}`,
    rawPath: path,
    rawQueryString: "",
    headers: { authorization: "Bearer test-session" },
    requestContext: {
      http: { method, path, protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "test" },
      requestId: "test-req-id", accountId: "123", apiId: "api", domainName: "test",
      domainPrefix: "test", stage: "$default", time: "", timeEpoch: 0,
    },
    isBase64Encoded: false,
    ...opts,
  } as APIGatewayProxyEventV2;
}

describe("orchestrator handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthRepo.validateSession.mockResolvedValue({
      userId: "user-1", tenantId: "tenant-1", email: "test@atlasit.pro", role: "admin",
    });
  });

  describe("GET /health", () => {
    it("returns 200", async () => {
      const result = await handler(makeEvent("GET", "/health"));
      expect(result.statusCode).toBe(200);
    });
  });

  describe("POST /api/v1/events", () => {
    it("rejects missing type/source", async () => {
      const result = await handler(makeEvent("POST", "/api/v1/events", { body: JSON.stringify({}) }));
      expect(result.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/agents", () => {
    it("returns agent list", async () => {
      const result = await handler(makeEvent("GET", "/api/v1/agents"));
      expect(result.statusCode).toBe(200);
    });
  });

  describe("GET /api/v1/dead-letter/stats/summary", () => {
    it("returns tenant-scoped DLQ stats", async () => {
      const result = await handler(makeEvent("GET", "/api/v1/dead-letter/stats/summary"));
      expect(result.statusCode).toBe(200);
    });
  });

  describe("POST /api/v1/dead-letter/:id/replay", () => {
    it("requires admin role", async () => {
      mockAuthRepo.validateSession.mockResolvedValue({
        userId: "user-2", tenantId: "tenant-1", email: "viewer@test.com", role: "viewer",
      });
      const result = await handler(makeEvent("POST", "/api/v1/dead-letter/abc123/replay"));
      expect(result.statusCode).toBe(403);
    });
  });

  describe("unknown route", () => {
    it("returns 404", async () => {
      const result = await handler(makeEvent("GET", "/api/v1/nonexistent"));
      expect(result.statusCode).toBe(404);
    });
  });
});
