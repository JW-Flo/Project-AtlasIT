// Vitest globals import
import { describe, it, expect } from "vitest";
// Cloudflare Workers types

// Since we're in a monorepo and the onboarding worker is TypeScript cloudflare module style export default { fetch() {} }
// we can import the built output if available or the TS directly (Vitest + ts-node style transpile).
import worker from "../onboarding/src/index";

// Minimal mock Env implementing only the pieces we touch.
const mockEnv = (): any => ({
  STATE: {
    store: new Map<string, string>(),
    async get(key: string) {
      return this.store.get(key);
    },
    async put(key: string, value: string) {
      this.store.set(key, value);
    },
  },
  DB: {
    prepare() {
      return {
        bind() {
          return { run: async () => ({ success: true }) };
        },
      };
    },
  },
  AI_API_KEY: "test-ai-key",
});

async function call(method: string, path: string, body?: any) {
  const reqInit: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) reqInit.body = JSON.stringify(body);
  const request = new Request(`https://example.com${path}`, reqInit);
  const resp = await worker.fetch(request, mockEnv());
  const text = await resp.text();
  let json: any = undefined;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: resp.status, json, raw: text };
}

describe("Onboarding worker endpoints", () => {
  it("health endpoint returns healthy", async () => {
    const res = await call("GET", "/health");
    expect(res.status).toBe(200);
    expect(res.json.status).toBe("healthy");
    expect(res.json.service).toBe("onboarding");
  });

  it("/onboarding/start returns questions", async () => {
    const res = await call("POST", "/onboarding/start", {
      industry: "healthcare",
      requirements: ["compliance"],
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.json.questions)).toBe(true);
    const ids = res.json.questions.map((q: any) => q.id);
    expect(ids).toContain("phi_storage");
    expect(ids).toContain("audit_frequency");
  });

  it("/onboarding/submit creates onboarding state", async () => {
    const tenantId = "t123";
    const res = await call("POST", "/onboarding/submit", {
      tenantId,
      name: "Test Co",
      industry: "tech",
      requirements: [],
    });
    expect(res.status).toBe(201);
    expect(res.json.status).toBe("success");
    expect(res.json.tenantId).toBe(tenantId);
  });

  it("GET onboarding status returns stored state", async () => {
    const tenantId = "t456";
    await call("POST", "/onboarding/submit", {
      tenantId,
      name: "Org Two",
      industry: "tech",
      requirements: [],
    });
    const res = await call("GET", `/api/onboarding/${tenantId}`);
    expect(res.status).toBe(200);
    expect(res.json.status).toBe("configured");
    expect(res.json.config).toBeDefined();
  });

  it("rejects submit missing required fields", async () => {
    const res = await call("POST", "/onboarding/submit", {
      name: "NoTenant",
      industry: "tech",
    });
    expect(res.status).toBe(400);
    expect(res.json.error).toMatch(/Missing required fields/);
  });

  it("returns 404 for unknown onboarding status", async () => {
    const res = await call("GET", "/api/onboarding/unknown123");
    expect(res.status).toBe(404);
  });
});
