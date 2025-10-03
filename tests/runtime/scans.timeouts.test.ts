import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { initRegistry } from "../../src/runtime/registry/registry";
import { registerFeature } from "../../src/runtime/features/registry";
import {
  runScan,
  resetScanRuntime,
  getScanTimings,
  runFullScan,
} from "../../src/runtime/scans/service";
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
  restoreBaseRegistry();
  resetScanRuntime();
  resetEnv();
  clearConfigCache();
});

afterEach(() => {
  resetEnv();
  restoreBaseRegistry();
  resetScanRuntime();
  clearConfigCache();
});

describe("scan module guardrails", () => {
  it("produces MODULE_TIMEOUT finding when execution exceeds timeout", async () => {
    const slowFeature: ScanFeature = {
      id: "timeout-test",
      kind: "scan",
      provides: ["meta"],
      run: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { findings: [] };
      },
    };
    registerFeature(slowFeature);

    process.env.ENABLED_SCAN_TYPES = "timeout-test";
    process.env.SCAN_MODULE_TIMEOUT_TIMEOUT_TEST = "50";
    clearConfigCache();

    const result = await runScan("timeout-test", "https://example.com", {
      env: process.env,
    });
    expect(
      result.findings.some((finding) => finding.code === "MODULE_TIMEOUT"),
    ).toBe(true);

    const metrics = getScanTimings();
    const moduleMetrics = metrics.modules["timeout-test"];
    expect(moduleMetrics.timeoutCount).toBe(1);
    expect(moduleMetrics.timeoutRate).toBe(1);
    expect(moduleMetrics.errorCount).toBe(0);
    expect(moduleMetrics.successRate).toBe(0);
    expect(metrics.total.successRate).toBe(0);
  });
});

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
