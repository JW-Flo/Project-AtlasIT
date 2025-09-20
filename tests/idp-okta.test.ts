import { beforeEach, describe, expect, it } from "vitest";
import {
  createOktaAdapter,
  OKTA_FLAG_ENV,
  OKTA_ADAPTER_ID,
} from "@atlasit/idp-adapters/okta";
import { clearRegistry, getRegistration, registerAdapter } from "@atlasit/idp";

function resetEnv() {
  delete process.env[OKTA_FLAG_ENV];
}

describe("Okta offline adapter", () => {
  beforeEach(() => {
    clearRegistry();
    resetEnv();
  });

  it("provisions a user with valid groups", async () => {
    const adapter = createOktaAdapter();

    registerAdapter(OKTA_ADAPTER_ID, adapter, { flagEnvVar: OKTA_FLAG_ENV });

    const result = await adapter.provision({
      user: {
        id: "user-999",
        email: "new.joiner@okta.local",
        displayName: "New Joiner",
      },
      groups: ["group-admins", "group-it"],
    });

    expect(result.created).toBe(true);
    expect(result.user.groups).toEqual(["group-admins", "group-it"]);

    const fetched = await adapter.getUser("user-999");
    expect(fetched?.email).toBe("new.joiner@okta.local");
    expect(fetched?.groups).toEqual(["group-admins", "group-it"]);

    const groups = await adapter.listGroups();
    const admins = groups.find((group) => group.id === "group-admins");
    const it = groups.find((group) => group.id === "group-it");
    expect(admins?.members).toContain("user-999");
    expect(it?.members).toContain("user-999");

    const registration = getRegistration(OKTA_ADAPTER_ID);
    expect(registration?.flagEnvVar).toBe(OKTA_FLAG_ENV);
  });

  it("rejects provisioning when groups are unknown", async () => {
    const adapter = createOktaAdapter();

    await expect(
      adapter.provision({
        user: {
          id: "user-998",
          email: "missing.group@okta.local",
        },
        groups: ["group-missing"],
      }),
    ).rejects.toThrow(/Unknown groups/);
  });
});
