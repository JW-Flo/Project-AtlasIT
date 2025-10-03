import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { registerFeature } from "../../src/runtime/features/registry";
import { initRegistry } from "../../src/runtime/registry/registry";
import { clearConfigCache } from "../../src/runtime/config/dynamicConfig";
import {
  runFullScan,
  resetScanRuntime,
  getScanTimings,
} from "../../src/runtime/scans/service";
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
  vi.restoreAllMocks();
  resetEnv();
  restoreBaseRegistry();
  resetScanRuntime();
  clearConfigCache();
});

describe("scan metrics aggregation", () => {
  it("captures rolling metrics with p50/p95 and rate calculations", async () => {
    let invocation = 0;
    const metricsFeature: ScanFeature = {
      id: "metrics-test",
      kind: "scan",
      provides: ["meta"],
      run: async () => {
        invocation += 1;
        if (invocation === 2) {
          throw new Error("boom");
        }
        return { findings: [] };
      },
    };

    registerFeature(metricsFeature);
    process.env.ENABLED_SCAN_TYPES = "metrics-test";
    clearConfigCache();

    const timeline = [0, 5, 15, 25, 30, 35, 55, 80];
    let idx = 0;
    const nowSpy = vi
      .spyOn(globalThis.performance || { now: () => Date.now() }, "now" as any)
      .mockImplementation(
        () => timeline[idx++] ?? timeline[timeline.length - 1],
      );

    await runFullScan("https://example.com", { env: process.env });
    await runFullScan("https://example.com", { env: process.env });

    nowSpy.mockRestore();

    const metrics = getScanTimings();
    expect(metrics.total.count).toBeGreaterThanOrEqual(2);
    expect(metrics.total.p50).toBe(25);
    expect(metrics.total.p95).toBe(50);
    expect(metrics.total.successRate).not.toBeNull();
    expect(metrics.total.successRate).toBeCloseTo(0.5, 5);

    const moduleMetrics = metrics.modules["metrics-test"];
    expect(moduleMetrics.count).toBeGreaterThanOrEqual(2);
    expect(moduleMetrics.p50).toBe(10);
    expect(moduleMetrics.p95).toBe(20);
    expect(moduleMetrics.timeoutCount).toBe(0);
    expect(moduleMetrics.errorCount).toBe(1);
    expect(moduleMetrics.timeoutRate).toBe(0);
    expect(moduleMetrics.successRate).toBeCloseTo(0.5, 5);
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
