import { describe, expect, it, beforeEach } from "vitest";
import {
  registerAdapter,
  listAdapters,
  clearRegistry,
  getAdapter,
} from "../packages/idp/src/index.ts";
import type {
  IdentityProvider,
  ProvisionRequest,
  MoveRequest,
  DeprovisionRequest,
  OperationResult,
} from "../packages/idp/src/types.ts";

class DummyAdapter implements IdentityProvider {
  id = "dummy";
  displayName = "Dummy Adapter";
  featureFlag = "FEATURE_IDP_DUMMY";

  async provisionUser(_: ProvisionRequest): Promise<OperationResult> {
    return { ok: true };
  }
  async moveUser(_: MoveRequest): Promise<OperationResult> {
    return { ok: true };
  }
  async deprovisionUser(_: DeprovisionRequest): Promise<OperationResult> {
    return { ok: true };
  }
  async getUser() {
    return null;
  }
  async listGroups() {
    return [];
  }
}

beforeEach(() => {
  clearRegistry();
});

describe("IdP registry", () => {
  it("lists only enabled adapters when flag required", () => {
    registerAdapter("dummy", new DummyAdapter());
    const enabled = listAdapters({
      enabledOnly: true,
      env: { FEATURE_IDP_DUMMY: "1" },
    });
    expect(enabled).toHaveLength(1);
    expect(enabled[0]?.id).toBe("dummy");

    const disabled = listAdapters({ enabledOnly: true, env: {} });
    expect(disabled).toHaveLength(0);
  });

  it("getAdapter respects requireEnabled", () => {
    registerAdapter("dummy", new DummyAdapter());
    expect(getAdapter("dummy", { env: {}, requireEnabled: true })).toBeNull();
    expect(
      getAdapter("dummy", {
        env: { FEATURE_IDP_DUMMY: "1" },
        requireEnabled: true,
      }),
    ).not.toBeNull();
  });
});
