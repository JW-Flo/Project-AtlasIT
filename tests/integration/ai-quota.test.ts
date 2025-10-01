import { describe, it, expect, beforeEach } from "vitest";
import { handleRequest } from "../../ai-orchestrator/index.js";

// Minimal KV stub
class KvNamespaceStub {
  store = new Map();
  async get(key, opts) {
    const v = this.store.get(key);
    if (!v) return null;
    if (opts?.type === "json") {
      try {
        return JSON.parse(v);
      } catch {
        return null;
      }
    }
    return v;
  }
  async put(key, value) {
    this.store.set(key, value);
  }
}

let ipCounter = 0;
function mkReq(path, body, opts = {}) {
  const ip = opts.ip || `127.0.0.${ipCounter++}`;
  return new Request("https://example.com" + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": "test",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify(body || {}),
  });
}

function mkGet(path) {
  return new Request("https://example.com" + path, {
    method: "GET",
    headers: { "x-api-key": "test" },
  });
}

describe("AI quota & rate limit", () => {
  let env;
  beforeEach(() => {
    env = {
      AI_QUOTA: new KvNamespaceStub(),
      AI_MAX_REQUESTS_PER_DAY: "3",
      AI_RATE_BURST: "2",
      AI_RATE_WINDOW_SECONDS: "60",
      API_ALLOWED_KEYS: "test",
      AI_ALLOWED_MODELS: "@cf/meta/llama-3.1-8b-instruct",
    };
    // deterministic model stub - monkey patch generateAI if referenced indirectly
    globalThis.generateAI = async () => "ok";
  });

  it("increments persisted quota and enforces daily limit (independent IPs to avoid burst)", async () => {
    const r1 = await handleRequest(
      mkReq("/ai/infer", { prompt: "hi1" }),
      env,
      {},
    );
    const r2 = await handleRequest(
      mkReq("/ai/infer", { prompt: "hi2" }),
      env,
      {},
    );
    const r3 = await handleRequest(
      mkReq("/ai/infer", { prompt: "hi3" }),
      env,
      {},
    );
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(200);
    const r4 = await handleRequest(
      mkReq("/ai/infer", { prompt: "exceed" }),
      env,
      {},
    );
    expect(r4.status).toBe(429);
    const body = await r4.json();
    // Could be quota or burst depending on timing; assert quota OR rate limit semantics
    expect(["rate_limited", "Daily AI request quota reached"]).toContain(
      body.error,
    );
  });

  it("applies IP burst rate limiting (single IP)", async () => {
    const ip = "10.0.0.1";
    const r1 = await handleRequest(
      mkReq("/ai/infer", { prompt: "a" }, { ip }),
      env,
      {},
    );
    const r2 = await handleRequest(
      mkReq("/ai/infer", { prompt: "b" }, { ip }),
      env,
      {},
    );
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const r3 = await handleRequest(
      mkReq("/ai/infer", { prompt: "c" }, { ip }),
      env,
      {},
    );
    expect(r3.status).toBe(429);
    const b3 = await r3.json();
    expect(b3.error).toBe("rate_limited");
  });

  it("health exposes quota fields", async () => {
    await handleRequest(mkReq("/ai/infer", { prompt: "a" }), env, {});
    const h = await handleRequest(mkGet("/health"), env, {});
    expect(h.status).toBe(200);
    const data = await h.json();
    expect(data.quota).toBeTruthy();
    expect(typeof data.quota.used).toBe("number");
    expect(data.quota.limit).toBe(3);
  });
});
