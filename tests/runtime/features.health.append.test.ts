import { beforeEach, describe, expect, it } from "vitest";
import { initRegistry } from "../../src/runtime/registry/registry";
import { registerFeature } from "../../src/runtime/features/registry";

beforeEach(() => {
  initRegistry();
});

describe("health endpoint feature append", () => {
  it("includes feature counts and version", async () => {
    registerFeature({
      id: "health-check-scan",
      kind: "scan",
      version: "1.0.0",
      provides: ["meta"],
      run: async () => ({ findings: [] }),
    });

    const { GET } = await import("../../../JW-Site/src/pages/api/health.ts");
    const response = await GET({ locals: { runtime: { env: {} } } } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.dynamicRegistry).toBeDefined();
    expect(body.dynamicRegistry.features).toBeDefined();
    expect(body.dynamicRegistry.features.version).toBeGreaterThan(0);
    expect(body.dynamicRegistry.features.countsByKind.scan).toBeGreaterThan(0);
  });
});
