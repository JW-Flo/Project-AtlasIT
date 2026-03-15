import { describe, it, expect, vi } from "vitest";

function createMockDb(overrides?: {
  first?: () => Promise<unknown>;
  run?: () => Promise<unknown>;
}) {
  const mockRun = overrides?.run ?? (async () => ({ success: true }));
  const mockFirst = overrides?.first ?? (async () => null);
  return {
    prepare: () => ({
      bind: (..._args: unknown[]) => ({
        run: mockRun,
        first: mockFirst,
      }),
    }),
  };
}

function createMockState(overrides?: {
  put?: (...args: unknown[]) => Promise<void>;
  get?: (key: string) => Promise<string | null>;
}) {
  return {
    put: overrides?.put ?? (async () => {}),
    get: overrides?.get ?? (async () => null),
    delete: async () => {},
    list: async () => ({ keys: [], list_complete: true }),
    getWithMetadata: async () => ({ value: null, metadata: null }),
  };
}

describe("Onboarding Worker", () => {
  it("should respond with health status", async () => {
    const request = new Request("https://example.com/health");
    const env: any = {
      STATE: createMockState(),
      DB: createMockDb(),
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    const body: any = await response.json();

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
    const dbRunMock = vi.fn(async () => ({}));

    const env: any = {
      STATE: createMockState({ put: statePutMock }),
      DB: createMockDb({ run: dbRunMock, first: async () => null }),
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    const responseBody: any = await response.json();

    expect(response.status).toBe(201);
    expect(responseBody.status).toBe("success");
    expect(dbRunMock).toHaveBeenCalled();
  });

  it("should return onboarding questions for GET /api/onboarding/questions", async () => {
    const request = new Request(
      "https://example.com/api/onboarding/questions?industry=healthcare&req=compliance&req=analytics",
    );
    const env: any = {
      STATE: createMockState(),
      DB: createMockDb(),
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.count).toBeGreaterThanOrEqual(3);
  });

  it("should return 404 for unknown tenant status", async () => {
    const request = new Request(
      "https://example.com/api/onboarding/nonexistent",
    );
    const env: any = {
      STATE: createMockState(),
      DB: createMockDb({ first: async () => null }),
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    expect(response.status).toBe(404);
    const body: any = await response.json();
    expect(body.error.code).toBe("ONB-006");
  });

  it("should retrieve existing tenant status", async () => {
    const tenantId = "tenant-status-1";
    const request = new Request(
      `https://example.com/api/onboarding/${tenantId}`,
    );
    const env: any = {
      STATE: createMockState(),
      DB: createMockDb({
        first: async () => ({
          id: "sess-1",
          tenant_id: tenantId,
          status: "configured",
          industry: "Technology",
          requirements: null,
          answers: null,
          generated_config: JSON.stringify({ sample: true }),
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: null,
          updated_at: new Date().toISOString(),
        }),
      }),
      AI_API_KEY: "test-key",
    };
    const response = await (
      await import("./index")
    ).default.fetch(request, env);
    expect(response.status).toBe(200);
    const body: any = await response.json();
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

    // Track calls to first() — return null on first call, completed session on second
    let firstCallCount = 0;
    const mockFirst = async () => {
      firstCallCount++;
      if (firstCallCount <= 1) return null; // first POST: idempotency check
      return {
        id: "sess-dup",
        tenant_id: tenantId,
        status: "completed",
        industry: "Technology",
        requirements: null,
        answers: null,
        generated_config: JSON.stringify({ dup: true }),
        error_message: null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    };

    const env: any = {
      STATE: createMockState(),
      DB: createMockDb({ run: async () => ({}), first: mockFirst }),
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
    const secondBody = (await secondResp.json()) as any;
    expect(secondBody.idempotent).toBe(true);
    expect(secondBody.tenantId).toBe(tenantId);
  });
});
