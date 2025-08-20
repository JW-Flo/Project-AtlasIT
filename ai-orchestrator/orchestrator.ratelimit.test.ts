import { describe, it, expect } from "vitest";
import { handleRequest } from "./index.js";

const envBase = {
  API_ALLOWED_KEYS: "k1",
  AI_DETERMINISTIC: "1",
  RATE_LIMIT_MAX_REQUESTS: "2",
  RATE_LIMIT_WINDOW_SECONDS: "60",
};

function invoke(path: string, key = "k1") {
  const req = new Request(`http://localhost${path}`, {
    headers: { "x-api-key": key },
  });
  return handleRequest(req, envBase, { waitUntil() {} });
}

describe("Orchestrator Rate Limiting", () => {
  it("returns 429 on third /status request for same key", async () => {
    const r1 = await invoke("/status");
    expect([200, 403]).toContain(r1.status);
    const r2 = await invoke("/status");
    expect([200, 403]).toContain(r2.status);
    const r3 = await invoke("/status");
    expect(r3.status).toBe(429);
    expect(r3.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(r3.headers.get("X-RateLimit-Remaining")).toBe("0");
    const body: any = await r3.json();
    expect(body.error).toBe("Rate limit exceeded");
    expect(body.actor).toBe("k1");
  });
});
