import { describe, it, expect } from "vitest";

// Simple fetch test using undici (built-in in node >=18) or global fetch

describe("HTTP surface", () => {
  it("returns 200 and trace header for /health", async () => {
    // Simulate request by importing worker module and calling fetch directly
    const mod = await import("../index.js");
    const req = new Request("https://example.com/health");
    const res = await mod.default.fetch(
      req,
      { dispatcher: { get: () => ({ fetch: (r) => new Response("noop") }) } },
      {},
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-trace-id")).toBeTruthy();
  });
});
