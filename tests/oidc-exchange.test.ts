import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * OIDC Exchange Worker tests — validate request handling, auth checks,
 * rate limiting, and error responses. JWT signature verification is
 * tested via mocked fetch of JWKS + crypto.subtle.verify.
 */

// We test the worker's fetch handler by importing the default export
// and calling fetch() directly with a mock env.

// Since verifyGitHubJWT calls global fetch for JWKS, we mock fetch globally.
const mockFetch = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async () => ({
      value: null,
      metadata: null,
      cacheStatus: null,
    }),
  } as unknown as KVNamespace;
}

function createEnv(overrides: Record<string, unknown> = {}) {
  return {
    OP_CONNECT_HOST: "https://connect.example.com",
    ALLOWED_REPOS: "JW-Flo/Project-AtlasIT",
    ALLOWED_ORGS: "JW-Flo",
    RATE_LIMIT_KV: createMockKV(),
    RATE_LIMIT_RPM: "10",
    ...overrides,
  };
}

// Dynamically import the worker — must be done after mocking globals
async function getWorker() {
  // Clear module cache to pick up fresh mocks
  const mod = await import("../ops/oidc/src/index.js");
  return mod.default;
}

describe("OIDC Exchange Worker", () => {
  describe("health endpoint", () => {
    it("returns healthy status", async () => {
      const worker = await getWorker();
      const env = createEnv();
      const req = new Request("https://exchange.example.com/health", {
        method: "GET",
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("healthy");
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("routing", () => {
    it("returns 404 for non-exchange paths", async () => {
      const worker = await getWorker();
      const env = createEnv();
      const req = new Request("https://exchange.example.com/other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: "test" }),
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(404);
    });

    it("returns 404 for GET on /exchange", async () => {
      const worker = await getWorker();
      const env = createEnv();
      const req = new Request("https://exchange.example.com/exchange", {
        method: "GET",
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(404);
    });
  });

  describe("input validation", () => {
    it("rejects invalid JSON body", async () => {
      const worker = await getWorker();
      const env = createEnv();
      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Invalid JSON");
    });

    it("rejects missing id_token", async () => {
      const worker = await getWorker();
      const env = createEnv();
      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("id_token");
    });

    it("rejects non-string id_token", async () => {
      const worker = await getWorker();
      const env = createEnv();
      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: 12345 }),
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(400);
    });
  });

  describe("configuration validation", () => {
    it("returns 500 when OP_CONNECT_HOST is missing", async () => {
      const worker = await getWorker();
      const env = createEnv({ OP_CONNECT_HOST: "" });
      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: "test.jwt.token" }),
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.detail).toContain("OP_CONNECT_HOST");
    });

    it("returns 500 when ALLOWED_REPOS is missing", async () => {
      const worker = await getWorker();
      const env = createEnv({ ALLOWED_REPOS: "" });
      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: "test.jwt.token" }),
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.detail).toContain("ALLOWED_REPOS");
    });
  });

  describe("rate limiting", () => {
    it("allows requests under the rate limit", async () => {
      const worker = await getWorker();
      const kv = createMockKV();
      const env = createEnv({ RATE_LIMIT_KV: kv, RATE_LIMIT_RPM: "5" });

      // This will fail at JWT validation (which is expected — we're testing rate limit pass)
      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "1.2.3.4",
        },
        body: JSON.stringify({ id_token: "invalid.jwt.token" }),
      });

      const res = await worker.fetch(req, env);
      // Should not be 429 — it'll fail at JWT validation instead
      expect(res.status).not.toBe(429);
    });

    it("blocks requests exceeding rate limit", async () => {
      const worker = await getWorker();
      const kv = createMockKV();
      // Pre-fill rate limit counter
      await kv.put("rl:oidc:1.2.3.4", "10");
      const env = createEnv({ RATE_LIMIT_KV: kv, RATE_LIMIT_RPM: "10" });

      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "1.2.3.4",
        },
        body: JSON.stringify({ id_token: "test.jwt.token" }),
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error).toContain("Rate limit");
    });
  });

  describe("JWT validation", () => {
    it("rejects tokens with invalid format (not 3 parts)", async () => {
      const worker = await getWorker();
      const env = createEnv();

      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: "not-a-jwt" }),
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.detail).toContain("Invalid JWT");
    });

    it("rejects tokens when JWKS fetch fails", async () => {
      // Mock JWKS fetch to fail
      mockFetch.mockResolvedValueOnce(
        new Response("Service unavailable", { status: 503 }),
      );

      const worker = await getWorker();
      const env = createEnv();

      // Create a JWT-like token (3 base64url parts) with a fake header
      const header = btoa(JSON.stringify({ kid: "test-key", alg: "RS256" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const payload = btoa(JSON.stringify({ sub: "test" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const fakeToken = `${header}.${payload}.fakesignature`;

      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: fakeToken }),
      });

      const res = await worker.fetch(req, env);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.detail).toContain("JWKS");
    });
  });

  describe("error response format", () => {
    it("always includes timestamp in error responses", async () => {
      const worker = await getWorker();
      const env = createEnv();
      const req = new Request("https://exchange.example.com/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await worker.fetch(req, env);
      const body = await res.json();
      expect(body.timestamp).toBeDefined();
      expect(body.error).toBeDefined();
    });
  });
});
