import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { initRegistry } from "../../src/runtime/registry/registry";
import { registerFeature } from "../../src/runtime/features/registry";
import {
  resolveEnabledScanIds,
  resetScanRuntime,
  runFullScan,
} from "../../src/runtime/scans/service";
import { clearConfigCache } from "../../src/runtime/config/dynamicConfig";
import { headersFeature } from "../../src/runtime/scans/headers";
import { sslFeature } from "../../src/runtime/scans/ssl";
import { infoFeature } from "../../src/runtime/scans/info";
import { threatIntelFeature } from "../../src/runtime/scans/threatIntel";
import { cveFeature } from "../../src/runtime/scans/cve";

const ORIGINAL_ENV = { ...process.env };
const BASE_FEATURES = [
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

describe("scan capability gating", () => {
  it("honours capability allowlist and denylist", async () => {
    process.env.ENABLE_CAPABILITIES = "threat-intel, vuln-cve";
    process.env.DISABLE_CAPABILITIES = "vuln-cve";
    clearConfigCache();

    const config = await (
      await import("../../src/runtime/config/dynamicConfig")
    ).getConfig({ forceReload: true });
    const enabled = resolveEnabledScanIds(config);

    expect(enabled).toContain("threat-intel");
    expect(enabled).not.toContain("cve");
  });

  it("prefers explicit scan id allowlist", async () => {
    process.env.ENABLED_SCAN_TYPES = "cve";
    process.env.DISABLED_SCAN_TYPES = "headers,ssl,info,threat-intel";
    clearConfigCache();

    const config = await (
      await import("../../src/runtime/config/dynamicConfig")
    ).getConfig({ forceReload: true });
    const enabled = resolveEnabledScanIds(config);

    expect(enabled).toEqual(["cve"]);
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
