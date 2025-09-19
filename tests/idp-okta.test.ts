import { describe, expect, it } from "vitest";
import { OktaMockAdapter } from "../packages/idp-adapters/okta/src/index.ts";

describe("Okta mock adapter", () => {
  it("provisions, moves, and deprovisions users", async () => {
    const adapter = new OktaMockAdapter();
    const email = "new.user@okta.example";
    const result = await adapter.provisionUser({
      user: {
        id: "okta-new",
        email,
        displayName: "New User",
      },
      groups: ["okta-group-admin"],
    });
    expect(result.ok).toBe(true);

    const move = await adapter.moveUser({
      userId: "okta-new",
      targetGroups: ["okta-group-finance"],
    });
    expect(move.ok).toBe(true);

    const deprovision = await adapter.deprovisionUser({ userId: "okta-new" });
    expect(deprovision.ok).toBe(true);
    expect(deprovision.user?.status).toBe("inactive");
  });

  it("returns failure when moving unknown user", async () => {
    const adapter = new OktaMockAdapter();
    const move = await adapter.moveUser({
      userId: "missing",
      targetGroups: [],
    });
    expect(move.ok).toBe(false);
  });
});
