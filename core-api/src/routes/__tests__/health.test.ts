import { describe, it, expect } from "vitest";
import { app } from "../../index";

function createMockEnv(overrides: Record<string, any> = {}) {
  return {
    DB: {
      prepare: () => ({
        first: async () => ({ "1": 1 }),
        bind: () => ({
          first: async () => ({ "1": 1 }),
          all: async () => ({ results: [] }),
          run: async () => ({ success: true }),
        }),
      }),
    },
    KV_SESSIONS: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    KV_CACHE: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    KV_FEATURE_FLAGS: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    ...overrides,
  };
}

describe("GET /health", () => {
  it("should return healthy status when D1 and KV are passing", async () => {
    const env = createMockEnv();
    const res = await app.request("/health", {}, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.d1.status).toBe("pass");
    expect(body.checks.kv.status).toBe("pass");
  });

  it("should return correct response shape", async () => {
    const env = createMockEnv();
    const res = await app.request("/health", {}, env);
    const body = await res.json();

    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("service");
    expect(body).toHaveProperty("checks");
    expect(body.service).toBe("core-api");
    expect(body.version).toBe("1.0.0");
    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  it("should return degraded status when D1 fails", async () => {
    const env = createMockEnv({
      DB: {
        prepare: () => ({
          first: async () => {
            throw new Error("D1 connection failed");
          },
          bind: () => ({
            first: async () => {
              throw new Error("D1 connection failed");
            },
            all: async () => ({ results: [] }),
            run: async () => ({ success: true }),
          }),
        }),
      },
    });

    const res = await app.request("/health", {}, env);
    const body = await res.json();

    expect(body.status).toBe("degraded");
    expect(body.checks.d1.status).toBe("fail");
    expect(body.checks.d1.message).toBe("D1 connection failed");
  });

  it("should return degraded status when KV fails", async () => {
    const env = createMockEnv({
      KV_SESSIONS: {
        get: async () => {
          throw new Error("KV unavailable");
        },
        put: async () => {},
        delete: async () => {},
      },
    });

    const res = await app.request("/health", {}, env);
    const body = await res.json();

    expect(body.status).toBe("degraded");
    expect(body.checks.kv.status).toBe("fail");
    expect(body.checks.kv.message).toBe("KV unavailable");
  });
});
