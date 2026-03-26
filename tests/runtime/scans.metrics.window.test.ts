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

describe("scan telemetry window sizing", () => {
  it("clamps window size and emits telemetry resize events", async () => {
    const windowFeature: ScanFeature = {
      id: "window-test",
      kind: "scan",
      provides: ["meta"],
      run: async () => ({ findings: [] }),
    };
    registerFeature(windowFeature);
    process.env.ENABLED_SCAN_TYPES = "window-test";
    clearConfigCache();

    for (let i = 0; i < 10; i += 1) {
      await runFullScan("https://example.com", { env: process.env });
    }

    process.env.SCAN_TELEMETRY_WINDOW = "4";
    const logSpy = vi.spyOn(console, "log");

    const metrics = getScanTimings();

    const resizeEventLogged = logSpy.mock.calls.some(
      ([event, payload]) =>
        event === "[runtime:scan.telemetry.resized]" &&
        typeof payload === "object" &&
        payload !== null &&
        (payload as Record<string, unknown>).previous === 50 &&
        (payload as Record<string, unknown>).next === 5,
    );

    expect(resizeEventLogged).toBe(true);
    expect(metrics.total.count).toBe(5);
    expect(metrics.total.successRate).toBe(1);
    expect(metrics.modules["window-test"].count).toBe(5);
    expect(metrics.modules["window-test"].successRate).toBe(1);

    logSpy.mockRestore();
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
