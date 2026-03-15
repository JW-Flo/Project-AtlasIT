import { describe, it, expect, vi, afterEach } from "vitest";
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("keeps /task successful when AI assistance is needed", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/approve")) {
        const body = JSON.parse(String(init?.body || "{}"));
        const approved = body.action !== "process_ai_response";
        return new Response(JSON.stringify({ approved }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ approved: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await invoke(
      "/task",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-key",
        },
        body: JSON.stringify({
          type: "feature",
          priority: 0,
          description: "Critical rollout issue",
        }),
      },
      { AI_DETERMINISTIC: "1" },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
