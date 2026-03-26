import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { registerFeature } from "../../src/runtime/features/registry";
import { initRegistry } from "../../src/runtime/registry/registry";
import { resetScanRuntime, runFullScan } from "../../src/runtime/scans/service";
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
  vi.restoreAllMocks();
  resetEnv();
  restoreBaseRegistry();
  resetScanRuntime();
  clearConfigCache();
});

describe("scan failure isolation", () => {
  it("continues executing remaining modules when one fails", async () => {
    const successFeature: ScanFeature = {
      id: "success-test",
      kind: "scan",
      provides: ["meta"],
      run: async () => ({
        findings: [
          {
            severity: "info",
            category: "Test",
            title: "Success module",
            description: "completed",
          },
        ],
      }),
    };

    const failingFeature: ScanFeature = {
      id: "failure-test",
      kind: "scan",
      provides: ["meta"],
      run: async () => {
        throw new Error("boom");
      },
    };

    registerFeature(successFeature);
    registerFeature(failingFeature);

    process.env.ENABLED_SCAN_TYPES = "failure-test,success-test";
    clearConfigCache();

    const result = await runFullScan("https://example.com", {
      env: process.env,
    });

    expect(
      result.findings.some((finding) => finding.title === "Success module"),
    ).toBe(true);
    expect(
      result.findings.some((finding) => finding.code === "MODULE_FAILED"),
    ).toBe(true);
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
