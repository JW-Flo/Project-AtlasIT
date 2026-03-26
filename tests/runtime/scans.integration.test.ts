import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  clearConfigCache,
  setConfigTTL,
} from "../../src/runtime/config/dynamicConfig";
import { getFeatures } from "../../src/runtime/features/registry";
import {
  getAvailableScanTypes,
  resolveEnabledScanIds,
  runFullScan,
  runScan,
  NoActiveScansError,
} from "../../src/runtime/scans/service";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  clearConfigCache();
  setConfigTTL(10);
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
});

afterEach(() => {
  clearConfigCache();
  setConfigTTL(30_000);
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value as string;
  }
});

const mockFetch = () => {
  const spy = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input: any, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      const method = init?.method || "GET";
      if (method === "HEAD") {
        if (url.endsWith("/.well-known/security.txt")) {
          return new Response("Contact: security@example.com", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }
        return new Response("", {
          status: 200,
          headers: {
            "Strict-Transport-Security": "max-age=63072000",
            server: "nginx/1.25.0",
          },
        });
      }

      if (url.startsWith("https://www.virustotal.com/api/v3/domains/")) {
        return new Response(
          JSON.stringify({
            data: {
              attributes: {
                last_analysis_stats: {
                  malicious: 0,
                  suspicious: 0,
                  harmless: 12,
                },
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.startsWith("https://app.opencve.io/api/cve")) {
        return new Response(JSON.stringify({ count: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("", { status: 404 });
    });
  return spy;
};

describe("runtime scan integration", () => {
  it("lists registered scan types and runs a module", async () => {
    const fetchSpy = mockFetch();
    process.env.VIRUSTOTAL_API_KEY = "test-key";
    process.env.OPENCVE_ENRICH = "true";

    const available = await getAvailableScanTypes();
    expect(available).toContain("headers");
    expect(available).toContain("threat-intel");

    const features = getFeatures("scan");
    const scanIds = features.map((feature) => feature.id);
    expect(scanIds).toContain("headers");
    expect(scanIds).toContain("ssl");
    const headersFeature = features.find((feature) => feature.id === "headers");
    expect(headersFeature?.provides).toEqual(
      expect.arrayContaining(["security-surface"]),
    );

    const result = await runScan("headers", "https://example.com", {
      env: process.env,
    });
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.scanType).toBe("headers");

    fetchSpy.mockRestore();
  });

  it("respects disable list and omits disabled scans from full run", async () => {
    process.env.DISABLE_SCANS = "threat-intel";
    clearConfigCache();

    const config = await (
      await import("../../src/runtime/config/dynamicConfig")
    ).getConfig({ forceReload: true });
    const enabled = resolveEnabledScanIds(config);
    expect(enabled).not.toContain("threat-intel");

    const fetchSpy = mockFetch();
    const full = await runFullScan(
      "https://example.com",
      { env: process.env },
      config,
    );
    const categories = new Set(
      full.findings.map((finding) => finding.category),
    );
    expect(categories.has("Threat Intelligence")).toBe(false);
    fetchSpy.mockRestore();
  });

  it("throws NO_ACTIVE_SCANS when config disables everything", async () => {
    process.env.ENABLE_SCANS = "non-existent";
    process.env.DISABLE_SCANS = "headers,ssl,info,threat-intel,cve";
    clearConfigCache();

    const config = await (
      await import("../../src/runtime/config/dynamicConfig")
    ).getConfig({ forceReload: true });
    await expect(
      runFullScan("https://example.com", { env: process.env }, config),
    ).rejects.toThrow(NoActiveScansError);
  });
});
