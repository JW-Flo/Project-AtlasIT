import { beforeEach, describe, expect, it } from "vitest";
import orchestrator, {
  handleRequest,
  __resetAiStateForTests,
} from "../../ai-orchestrator/index.js";

class MockKV {
  private store = new Map<string, string>();

  async get(key: string, options?: any) {
    const value = this.store.get(key);
    if (value == null) return null;
    if (!options) return value;
    const type = typeof options === "string" ? options : options.type;
    if (type === "json") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  async put(key: string, value: string) {
    this.store.set(key, value);
  }

  clear() {
    this.store.clear();
  }
}

function createEnv(overrides: Record<string, any> = {}) {
  const kv = overrides.AI_QUOTA ?? new MockKV();
  return {
    AI_TEST_MODE: "1",
    AI_ALLOWED_MODELS: "test-model",
    AI_MAX_PROMPT_CHARS: "4096",
    AI_MAX_REQUESTS_PER_DAY: "5",
    AI_RATE_BURST: "10",
    AI_RATE_WINDOW_SECONDS: "60",
    AI_QUOTA: kv,
    ...overrides,
  } as any;
}

async function invokeInfer(
  env: Record<string, any>,
  prompt = "hello",
  ip = "203.0.113.1",
) {
  const req = new Request("https://example.com/ai/infer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": ip,
    },
    body: JSON.stringify({ prompt, model: "test-model" }),
  });
  Object.defineProperty(req, "cf", {
    value: { connectingIP: ip },
  });
  const handler = handleRequest || orchestrator.fetch.bind(orchestrator);
  const res = await handler(req, env, {} as any);
  const json = await res.json();
  return { status: res.status, json, res };
}

const today = () => new Date().toISOString().slice(0, 10);

beforeEach(() => {
  __resetAiStateForTests();
});

describe("AI quota persistence & rate limiting", () => {
  it("persists quota usage in KV", async () => {
    const kv = new MockKV();
    const env = createEnv({ AI_QUOTA: kv, AI_MAX_REQUESTS_PER_DAY: "5" });
    const { status, json } = await invokeInfer(env);
    expect(status).toBe(200);
    expect(json.quota.used).toBe(1);

    const stored = await kv.get(`ai_quota:${today()}`, { type: "json" });
    expect(stored).toBeTruthy();
    expect(stored.count).toBe(1);
  });

  it("returns 429 when daily quota exceeded", async () => {
    const kv = new MockKV();
    const env = createEnv({ AI_QUOTA: kv, AI_MAX_REQUESTS_PER_DAY: "2" });
    expect((await invokeInfer(env)).status).toBe(200);
    expect((await invokeInfer(env)).status).toBe(200);
    const third = await invokeInfer(env);
    expect(third.status).toBe(429);
    expect(third.json.error).toBe("quota_exceeded");
    expect(third.json.quota.remaining).toBe(0);
  });

  it("applies per-IP burst rate limiting", async () => {
    const env = createEnv({
      AI_MAX_REQUESTS_PER_DAY: "20",
      AI_RATE_BURST: "3",
      AI_RATE_WINDOW_SECONDS: "60",
    });
    for (let i = 0; i < 3; i += 1) {
      const res = await invokeInfer(env, `hello-${i}`);
      expect(res.status).toBe(200);
    }
    const limited = await invokeInfer(env, "final");
    expect(limited.status).toBe(429);
    expect(limited.json.error).toBe("rate_limited");
    expect(limited.json.retryAfterSeconds).toBeGreaterThan(0);
    expect(limited.json.retryAfterSeconds).toBeLessThanOrEqual(60);
    const retryAfterHeader = limited.res.headers.get("Retry-After");
    expect(Number(retryAfterHeader)).toBeGreaterThan(0);
  });
});
