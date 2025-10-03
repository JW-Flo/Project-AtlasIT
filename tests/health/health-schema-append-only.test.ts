import { describe, it, expect } from "vitest";
import orchestrator from "../../ai-orchestrator/index.js";
import compliance from "../../compliance-worker/src/index.ts";
import snapshot from "./health-schema.snapshot.json";

class KvNamespaceStub {
  store = new Map();
  async get(k: string, o?: { type?: string }) {
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
  async put(k: string, v: string) {
    this.store.set(k, v);
  }
}

function req(url) {
  return new Request(url);
}

describe("Health schema append-only guard", () => {
  it("orchestrator health contains at least snapshot keys", async () => {
    const env = {
      AI_QUOTA: new KvNamespaceStub(),
      AI_MAX_REQUESTS_PER_DAY: "5",
      AI_RATE_BURST: "2",
      AI_RATE_WINDOW_SECONDS: "60",
      API_ALLOWED_KEYS: "",
    } as any;
    const res = await orchestrator.fetch(
      req("https://example.com/health"),
      env,
      {},
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const expected = (snapshot as any).orchestrator as string[];
    for (const key of expected) {
      expect(
        body,
        `Missing key '${key}' in orchestrator health response`,
      ).toHaveProperty(key);
    }
  });

  it("compliance worker health contains at least snapshot keys", async () => {
    const env = {} as any;
    const res = await compliance.fetch(req("https://example.com/health"), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    const expected = (snapshot as any)["compliance-worker"] as string[];
    for (const key of expected) {
      expect(
        body,
        `Missing key '${key}' in compliance health response`,
      ).toHaveProperty(key);
    }
  });
});
