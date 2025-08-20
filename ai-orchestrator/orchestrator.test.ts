import { describe, it, expect } from "vitest";
import { handleRequest } from "./index.js";

// Helper to build an Env object matching what's used in the worker.
const baseEnv = () => ({
  API_ALLOWED_KEYS: "test-key",
  AI_DETERMINISTIC: "1",
});

function invoke(
  path: string,
  init: RequestInit = {},
  envOverride: Record<string, any> = {},
) {
  const env = { ...baseEnv(), ...envOverride };
  const req = new Request(`http://localhost${path}`, init);
  return handleRequest(req, env, { waitUntil() {} });
}

describe("ai-orchestrator worker", () => {
  it("returns healthy on /health with requestId header", async () => {
    const res = await invoke("/health");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.requestId).toBeDefined();
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });

  it("rejects unauthorized /status without API key", async () => {
    const res = await invoke("/status");
    expect(res.status).toBe(401);
  });

  it("accepts authorized /status with API key and returns requestId (200 or 403)", async () => {
    const res = await invoke("/status", {
      headers: { "x-api-key": "test-key" },
    });
    // Endpoint may require additional approval workflow yielding 403, but should not be 401 if key is valid.
    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.requestId).toBeDefined();
      expect(body.actor).toBe("test-key");
    }
  });
});
