import { describe, it, expect } from "vitest";
import orchestrator from "../../ai-orchestrator/index.js";
import compliance from "../../compliance-worker/src/index.ts";

class KvNamespaceStub {
  store = new Map();
  async get(k, o) {
    const v = this.store.get(k);
    if (!v) return null;
    if (o?.type === "json") {
      try {
        return JSON.parse(v);
      } catch {
        return null;
      }
    }
    return v;
  }
  async put(k, v) {
    this.store.set(k, v);
  }
}

function req(url) {
  return new Request(url);
}

describe("Health endpoints extended", () => {
  it("orchestrator exposes quota & rateLimit", async () => {
    const env = {
      AI_QUOTA: new KvNamespaceStub(),
      AI_MAX_REQUESTS_PER_DAY: "5",
      AI_RATE_BURST: "2",
      AI_RATE_WINDOW_SECONDS: "60",
      API_ALLOWED_KEYS: "",
    };
    const res = await orchestrator.fetch(
      req("https://example.com/health"),
      env,
      {},
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.quota).toBeTruthy();
    expect(body.quota.limit).toBe(5);
    expect(body.rateLimit.windowSeconds).toBe(60);
  });

  it("compliance health has placeholder ai quota fields", async () => {
    const env = {}; // minimal env; D1 + R2 not required for presence test
    const res = await compliance.fetch(req("https://example.com/health"), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("aiQuotaUsed");
    expect(body).toHaveProperty("aiQuotaRemaining");
  });
});
