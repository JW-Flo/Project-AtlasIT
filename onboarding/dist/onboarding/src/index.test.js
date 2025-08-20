import { describe, it, expect, vi } from "vitest";
describe("Onboarding Worker", () => {
  it("should respond with health status", async () => {
    const request = new Request("https://example.com/health");
    const mockRun = async () => ({ success: true });
    const mockBind = () => ({ run: mockRun });
    const mockPrepare = () => ({ bind: mockBind });
    const env = {
      STATE: {
        put: async () => {},
        get: async () => null,
        delete: async () => {},
        list: async () => ({ keys: [], list_complete: true }),
        getWithMetadata: async () => ({ value: null, metadata: null }),
      },
      DB: { prepare: mockPrepare },
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.service).toBe("onboarding");
  });
  it("should initiate onboarding on POST /api/onboarding", async () => {
    const body = {
      tenantId: "tenant123",
      name: "Test Tenant",
      industry: "Technology",
    };
    const request = new Request("https://example.com/api/onboarding", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const statePutMock = vi.fn(async () => {});
    const dbRunMock = vi.fn(async () => {});
    const env = {
      STATE: {
        put: statePutMock,
        get: async () => null,
        delete: async () => {},
        list: async () => ({ keys: [], list_complete: true }),
        getWithMetadata: async () => ({ value: null, metadata: null }),
      },
      DB: { prepare: () => ({ bind: () => ({ run: dbRunMock }) }) },
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    const responseBody = await response.json();
    expect(response.status).toBe(201);
    expect(responseBody.status).toBe("success");
    expect(statePutMock).toHaveBeenCalled();
    expect(dbRunMock).toHaveBeenCalled();
  });
  it("should return onboarding questions for GET /api/onboarding/questions", async () => {
    const request = new Request(
      "https://example.com/api/onboarding/questions?industry=healthcare&req=compliance&req=analytics",
    );
    const mockRun = async () => ({});
    const env = {
      STATE: {
        put: async () => {},
        get: async () => null,
        delete: async () => {},
        list: async () => ({ keys: [], list_complete: true }),
        getWithMetadata: async () => ({ value: null, metadata: null }),
      },
      DB: { prepare: () => ({ bind: () => ({ run: mockRun }) }) },
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.count).toBeGreaterThanOrEqual(3);
  });
  it("should return 404 for unknown tenant status", async () => {
    const request = new Request(
      "https://example.com/api/onboarding/nonexistent",
    );
    const mockRun = async () => ({});
    const env = {
      STATE: {
        put: async () => {},
        get: async () => null,
        delete: async () => {},
        list: async () => ({ keys: [], list_complete: true }),
        getWithMetadata: async () => ({ value: null, metadata: null }),
      },
      DB: { prepare: () => ({ bind: () => ({ run: mockRun }) }) },
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("ONB-006");
  });
  it("should retrieve existing tenant status", async () => {
    const tenantId = "tenant-status-1";
    const stateValue = {
      status: "configured",
      config: { sample: true },
      template: { resources: [] },
    };
    const request = new Request(
      `https://example.com/api/onboarding/${tenantId}`,
    );
    const mockRun = async () => ({});
    const env = {
      STATE: {
        put: async () => {},
        get: async (key) =>
          key === `onboarding:${tenantId}` ? JSON.stringify(stateValue) : null,
        delete: async () => {},
        list: async () => ({ keys: [], list_complete: true }),
        getWithMetadata: async () => ({ value: null, metadata: null }),
      },
      DB: { prepare: () => ({ bind: () => ({ run: mockRun }) }) },
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("configured");
    expect(body.config).toBeDefined();
  });
  it("should return idempotent response on second POST", async () => {
    const tenantId = "tenant-dup-1";
    const firstBody = { tenantId, name: "Dup Co", industry: "Technology" };
    const request1 = new Request("https://example.com/api/onboarding", {
      method: "POST",
      body: JSON.stringify(firstBody),
    });
    // Mock env with STATE storing after first put
    let stored = null;
    const env = {
      STATE: {
        put: async (_k, v) => {
          stored = JSON.parse(v);
        },
        get: async (_k) => (stored ? JSON.stringify(stored) : null),
        delete: async () => {},
        list: async () => ({ keys: [], list_complete: true }),
        getWithMetadata: async () => ({ value: null, metadata: null }),
      },
      DB: { prepare: () => ({ bind: () => ({ run: async () => ({}) }) }) },
      AI_API_KEY: "test-key",
    };
    const mod = await import("./index");
    const firstResp = await mod.default.fetch(request1, env);
    expect(firstResp.status).toBe(201);
    const secondResp = await mod.default.fetch(
      new Request("https://example.com/api/onboarding", {
        method: "POST",
        body: JSON.stringify(firstBody),
      }),
      env,
    );
    expect(secondResp.status).toBe(200);
    const secondBody = await secondResp.json();
    expect(secondBody.idempotent).toBe(true);
    expect(secondBody.tenantId).toBe(tenantId);
  });
});
//# sourceMappingURL=index.test.js.map
