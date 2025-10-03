import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { registerFeature } from "../../src/runtime/features/registry";
import { initRegistry } from "../../src/runtime/registry/registry";
import { clearConfigCache } from "../../src/runtime/config/dynamicConfig";
import { runFullScan, resetScanRuntime } from "../../src/runtime/scans/service";
import type { ScanFeature } from "../../src/runtime/features/types";
import { headersFeature } from "../../src/runtime/scans/headers";
import { sslFeature } from "../../src/runtime/scans/ssl";
import { infoFeature } from "../../src/runtime/scans/info";
import { threatIntelFeature } from "../../src/runtime/scans/threatIntel";
import { cveFeature } from "../../src/runtime/scans/cve";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetEnv();
  restoreBaseRegistry();
  resetScanRuntime();
  clearConfigCache();
});

afterEach(() => {
  resetEnv();
  restoreBaseRegistry();
  resetScanRuntime();
  clearConfigCache();
});

describe("scan metrics endpoint", () => {
  it("exposes total and module telemetry only", async () => {
    const endpointFeature: ScanFeature = {
      id: "endpoint-test",
      kind: "scan",
      provides: ["meta"],
      run: async () => ({ findings: [] }),
    };
    registerFeature(endpointFeature);
    process.env.ENABLED_SCAN_TYPES = "endpoint-test";
    clearConfigCache();

    await runFullScan("https://example.com", { env: process.env });

    const { GET } = await import(
      "../../../JW-Site/src/pages/api/_scan-metrics.ts"
    );
    const response = await GET({} as any);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(Object.keys(body).sort()).toEqual(["modules", "total"]);
    expect(body.total).toBeDefined();
    expect(body.modules).toBeDefined();

    expect(body.total).toHaveProperty("count");
    expect(body.total).toHaveProperty("avg");
    expect(body.total).toHaveProperty("p50");
    expect(body.total).toHaveProperty("p95");
    expect(body.total).toHaveProperty("lastMs");
    expect(body.total).toHaveProperty("successRate");

    expect(body.modules).toHaveProperty("endpoint-test");
    expect(body.modules["endpoint-test"]).toHaveProperty("timeoutCount");
    expect(body.modules["endpoint-test"]).toHaveProperty("errorCount");
    expect(body.modules["endpoint-test"]).toHaveProperty("timeoutRate");
    expect(body.modules["endpoint-test"]).toHaveProperty("successRate");
  });
});

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value as string;
  }
}

function restoreBaseRegistry() {
  initRegistry();
  for (const feature of [
    headersFeature,
    sslFeature,
    infoFeature,
    threatIntelFeature,
    cveFeature,
  ]) {
    registerFeature(feature);
  }
  registerFeature({
    id: "full",
    kind: "scan",
    version: "2.0.0",
    provides: ["meta"],
    run: async (target: string, ctx: any) => runFullScan(target, ctx),
  });
}
