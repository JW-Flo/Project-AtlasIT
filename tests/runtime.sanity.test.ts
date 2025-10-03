import { describe, it, expect } from "vitest";

// This test only validates that the main worker module can be imported without throwing.
// It does not execute fetch because some bindings (queues) are not yet active on current plan.

describe("runtime sanity", () => {
  it("loads main worker module", async () => {
    const mod = await import("../index.js");
    expect(mod).toBeTruthy();
    expect(typeof mod.default?.fetch).toBe("function");
  });
});
