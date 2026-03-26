import { describe, it, expect, beforeAll } from "vitest";
import { Miniflare } from "miniflare";
import { build } from "esbuild";
import { readFileSync } from "fs";
import path from "path";

// Tests per-key rate limiting on /onboarding/start (simpler path: no DB needed)

describe("Rate Limiting", () => {
  let mf: Miniflare;
  let bundled: string;

  beforeAll(async () => {
    const entry = path.join(__dirname, "../dist/onboarding/src/index.js");
    const outfile = path.join(__dirname, "bundled-worker.mjs");
    await build({
      entryPoints: [entry],
      bundle: true,
      format: "esm",
      platform: "browser",
      outfile,
      sourcemap: false,
      logLevel: "silent",
    });
    bundled = readFileSync(outfile, "utf-8");
    mf = new Miniflare({
      modules: true,
      script: bundled,
      kvNamespaces: ["STATE"],
      d1Databases: ["DB"],
      bindings: {
        AI_API_KEY: "test-key",
        API_ALLOWED_KEYS: "rl-key",
        RATE_LIMIT_MAX_REQUESTS: "2",
        RATE_LIMIT_WINDOW_SECONDS: "30",
      },
    });
  });

  async function startOnce() {
    return mf.dispatchFetch("http://localhost:8787/onboarding/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "rl-key" },
      body: JSON.stringify({ industry: "tech", requirements: [] }),
    });
  }

  it("enforces rate limit on third request", async () => {
    const r1 = await startOnce();
    expect(r1.status).toBe(200);
    const r2 = await startOnce();
    expect(r2.status).toBe(200);
    const r3 = await startOnce();
    expect(r3.status).toBe(429);
    const body: any = await r3.json();
    expect(body.error).toBe("Rate limit exceeded");
    expect(body.limit).toBe(2);
    expect(body.remaining).toBe(0);
    expect(r3.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(r3.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
