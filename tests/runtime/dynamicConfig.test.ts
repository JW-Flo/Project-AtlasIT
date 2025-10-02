import { beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("dynamic config loader", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL_ENV)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
      if (typeof value === "string") {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    }

    delete (globalThis as { ATLAS_KV?: unknown }).ATLAS_KV;
  });

  it("parses enable/disable environment variables", async () => {
    process.env.ENABLE_SCANS = "ssl, headers";
    process.env.DISABLE_SCANS = "threat-intel";

    const { getConfig } = await import(
      "../../src/runtime/config/dynamicConfig"
    );
    const config = await getConfig({ forceReload: true });

    expect(config.enable.scans).toEqual(["ssl", "headers"]);
    expect(config.disable.scans).toEqual(["threat-intel"]);
    expect(config.source).toBe("env");
    expect(config.rawEnv.ENABLE_SCANS).toBe("ssl, headers");
  });

  it("leverages caching with TTL and force reload", async () => {
    process.env.ENABLE_SCANS = "ssl";

    const mod = await import("../../src/runtime/config/dynamicConfig");
    mod.setConfigTTL(50);

    const first = await mod.getConfig({ forceReload: true });
    const second = await mod.getConfig();

    expect(second).toBe(first);

    await new Promise((resolve) => setTimeout(resolve, 60));

    const third = await mod.getConfig();
    expect(third).not.toBe(first);
    expect(third.version).toBeGreaterThan(first.version);

    mod.setConfigTTL(30_000);
    mod.clearConfigCache();
  });

  it("gives precedence to KV payload over environment", async () => {
    process.env.ENABLE_SCANS = "ssl,headers";

    (
      globalThis as { ATLAS_KV?: { get: (key: string) => Promise<string> } }
    ).ATLAS_KV = {
      get: vi.fn().mockResolvedValue(
        JSON.stringify({
          enable: { scans: ["only-ssl"] },
        }),
      ),
    };

    const { getConfig } = await import(
      "../../src/runtime/config/dynamicConfig"
    );
    const config = await getConfig({ forceReload: true });

    expect(config.enable.scans).toEqual(["only-ssl"]);
    expect(config.source).toBe("mixed");
  });

  it("indicates kv origin when only kv provides config", async () => {
    (
      globalThis as { ATLAS_KV?: { get: (key: string) => Promise<string> } }
    ).ATLAS_KV = {
      get: vi.fn().mockResolvedValue(
        JSON.stringify({
          disable: { scans: ["threat-intel"] },
        }),
      ),
    };

    const { getConfig } = await import(
      "../../src/runtime/config/dynamicConfig"
    );
    const config = await getConfig({ forceReload: true });

    expect(config.disable.scans).toEqual(["threat-intel"]);
    expect(config.source).toBe("kv");
  });
});
