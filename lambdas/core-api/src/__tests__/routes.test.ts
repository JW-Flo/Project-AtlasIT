import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

// Mock bootstrap before importing handler
const mockSessionRepo = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
const mockCacheRepo = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
const mockFlagRepo = { get: vi.fn(), isEnabled: vi.fn(), set: vi.fn(), listAll: vi.fn() };
const mockAuditRepo = { log: vi.fn(), list: vi.fn() };
const mockTenantRepo = { getById: vi.fn(), getBySlug: vi.fn(), getUserByEmail: vi.fn(), listUsers: vi.fn() };
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
  return {
    default: {
      Pool: vi.fn(() => ({ query: mockQuery })),
    },
  };
});

import { handler } from "../handler.js";

function makeEvent(
  method: string,
  path: string,
  opts?: Partial<APIGatewayProxyEventV2>,
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: `${method} ${path}`,
    rawPath: path,
    rawQueryString: "",
    headers: { authorization: "Bearer test-session" },
    requestContext: {
      http: { method, path, protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "test" },
      requestId: "test-req-id",
      accountId: "123",
      apiId: "api",
      domainName: "test",
      domainPrefix: "test",
      stage: "$default",
      time: "",
      timeEpoch: 0,
    },
    isBase64Encoded: false,
    ...opts,
  } as APIGatewayProxyEventV2;
}

describe("core-api handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthRepo.validateSession.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
      email: "test@atlasit.pro",
      role: "admin",
    });
  });

  describe("GET /health", () => {
    it("returns 200 with status ok", async () => {
      const event = makeEvent("GET", "/health");
      const result = await handler(event);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.status).toBe("healthy");
    });
  });

  describe("GET /api/v1/tenants", () => {
    it("returns 401 without auth", async () => {
      mockAuthRepo.validateSession.mockResolvedValue(null);
      const event = makeEvent("GET", "/api/v1/tenants", { headers: {} });
      const result = await handler(event);
      expect(result.statusCode).toBe(401);
    });

    it("returns tenant list for authenticated admin", async () => {
      const event = makeEvent("GET", "/api/v1/tenants");
      const result = await handler(event);
      expect(result.statusCode).toBe(200);
    });
  });

  describe("POST /api/v1/events", () => {
    it("returns 400 without required fields", async () => {
      const event = makeEvent("POST", "/api/v1/events", {
        body: JSON.stringify({}),
      });
      const result = await handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/flags", () => {
    it("returns flag list", async () => {
      mockFlagRepo.listAll.mockResolvedValue([]);
      const event = makeEvent("GET", "/api/v1/flags");
      const result = await handler(event);
      expect(result.statusCode).toBe(200);
    });
  });

  describe("POST /api/v1/auth/validate", () => {
    it("returns 200 with valid session", async () => {
      const event = makeEvent("POST", "/api/v1/auth/validate");
      const result = await handler(event);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.data?.tenantId).toBe("tenant-1");
    });
  });

  describe("unknown route", () => {
    it("returns 404", async () => {
      const event = makeEvent("GET", "/api/v1/nonexistent");
      const result = await handler(event);
      expect(result.statusCode).toBe(404);
    });
  });
});
