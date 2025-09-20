import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRegistry,
  getAdapter,
  listAdapters,
  registerAdapter,
} from "@atlasit/idp";
import type { IdpAdapter } from "@atlasit/idp";

describe("IdP registry", () => {
  const flag = "FEATURE_TEST_ADAPTER";

  function createAdapter(name: string): IdpAdapter {
    return {
      metadata: { name, kind: "fallback" },
      async getUser() {
        return null;
      },
      async listUsers() {
        return [];
      },
      async listGroups() {
        return [];
      },
      async issueToken() {
        return {
          token: "token",
          issuedAt: new Date(0).toISOString(),
          expiresAt: new Date(0).toISOString(),
        };
      },
    };
  }

  beforeEach(() => {
    clearRegistry();
    delete process.env[flag];
  });

  it("registers adapters and reports enabled state", () => {
    const adapter = createAdapter("Sample");

    registerAdapter("sample", adapter, { flagEnvVar: flag });

    const [entry] = listAdapters();
    expect(entry).toBeDefined();
    expect(entry.id).toBe("sample");
    expect(entry.enabled).toBe(false);
    expect(entry.flagEnvVar).toBe(flag);
    expect(getAdapter("sample")).toBe(adapter);
  });

  it("filters enabled adapters when requested", () => {
    const adapter = createAdapter("Sample");
    registerAdapter("sample", adapter, { flagEnvVar: flag });

    process.env[flag] = "1";

    const enabled = listAdapters({ enabledOnly: true });
    expect(enabled).toHaveLength(1);
    expect(enabled[0].id).toBe("sample");
    expect(enabled[0].enabled).toBe(true);
  });
});
