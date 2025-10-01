import { beforeEach, describe, expect, it } from "vitest";
import orchestrator, {
  handleRequest as orchestratorHandle,
  __resetAiStateForTests,
} from "../../ai-orchestrator/index.js";
import complianceWorker from "../../compliance-worker/src/index.ts";

class MockKV {
  private store = new Map<string, string>();

  async get(key: string, options?: any) {
    const value = this.store.get(key);
    if (value == null) return null;
    const type = typeof options === "string" ? options : options?.type;
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
}

function orchestratorEnv(overrides: Record<string, any> = {}) {
  return {
    AI_TEST_MODE: "1",
    AI_ALLOWED_MODELS: "test-model",
    AI_MAX_PROMPT_CHARS: "4096",
    AI_MAX_REQUESTS_PER_DAY: "5",
    AI_RATE_BURST: "8",
    AI_RATE_WINDOW_SECONDS: "60",
    AI_QUOTA: overrides.AI_QUOTA ?? new MockKV(),
    ...overrides,
  } as any;
}

async function callOrchestrator(path: string, env: Record<string, any>) {
  const req = new Request(`https://example.com${path}`, { method: "GET" });
  const handler = orchestratorHandle || orchestrator.fetch.bind(orchestrator);
  const res = await handler(req, env, {} as any);
  const json = await res.json();
  return { status: res.status, json };
}

beforeEach(() => {
  __resetAiStateForTests();
});

describe("Extended health endpoints", () => {
  it("ai orchestrator health exposes quota metadata", async () => {
    const env = orchestratorEnv();
    const { status, json } = await callOrchestrator("/health", env);
    expect(status).toBe(200);
    expect(json.service).toBe("ai-orchestrator");
    expect(json).toHaveProperty("quota");
    expect(json.quota).toMatchObject({
      date: expect.any(String),
      used: expect.any(Number),
      limit: expect.any(Number),
    });
    expect(json).toHaveProperty("rateLimitWindowSeconds");
    expect(json).toHaveProperty("rateLimitBurst");
  });

  it("compliance worker health includes AI quota placeholders", async () => {
    const req = new Request("https://example.com/health");
    const res = await complianceWorker.fetch(req, {} as any, {} as any);
    const json = await res.json();
    expect(json).toHaveProperty("aiQuotaUsed");
    expect(json).toHaveProperty("aiQuotaRemaining");
  });
});
