import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { registerFeature } from "../../src/runtime/features/registry";
import { initRegistry } from "../../src/runtime/registry/registry";
import { runFullScan, resetScanRuntime } from "../../src/runtime/scans/service";
import { clearConfigCache } from "../../src/runtime/config/dynamicConfig";
import type { ScanFeature } from "../../src/runtime/features/types";
import { headersFeature } from "../../src/runtime/scans/headers";
import { sslFeature } from "../../src/runtime/scans/ssl";
import { infoFeature } from "../../src/runtime/scans/info";
import { threatIntelFeature } from "../../src/runtime/scans/threatIntel";
import { cveFeature } from "../../src/runtime/scans/cve";

const ORIGINAL_ENV = { ...process.env };
const BASE_FEATURES: ScanFeature[] = [
  headersFeature,
  sslFeature,
  infoFeature,
  threatIntelFeature,
  cveFeature,
];

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

describe("diagnostics scan timings", () => {
  it("exposes scan timing metrics via diagnostics endpoint", async () => {
    const diagFeature: ScanFeature = {
      id: "diagnostics-test",
      kind: "scan",
      provides: ["meta"],
      run: async () => ({ findings: [] }),
    };
    registerFeature(diagFeature);
    process.env.ENABLED_SCAN_TYPES = "diagnostics-test";
    clearConfigCache();

    await runFullScan("https://example.com", { env: process.env });

    const { GET } = await import(
      "../../../JW-Site/src/pages/api/_diagnostics.ts"
    );
    const response = await GET({} as any);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.diagnostics).toBeDefined();
    expect(payload.diagnostics.scanTimings.total.count).toBeGreaterThan(0);
    expect(
      payload.diagnostics.scanTimings.modules["diagnostics-test"].count,
    ).toBeGreaterThan(0);
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
  for (const feature of BASE_FEATURES) {
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
