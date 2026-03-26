import { describe, expect, it } from "vitest";
import { applyDecision, isPending, type AccessReviewItem } from "../console-app/src/routes/console/access-reviews/[id]/model";

function item(overrides: Partial<AccessReviewItem> = {}): AccessReviewItem {
  return {
    id: "item_1",
    userId: "user_1",
    userEmail: "manager@test.com",
    appId: "github",
    appName: "GitHub",
    status: "pending",
    ...overrides,
  };
}

describe("access review detail model", () => {
  it("identifies pending items", () => {
    expect(isPending(item())).toBe(true);
    expect(isPending(item({ status: "approved" }))).toBe(false);
  });

  it("applies approve decision to one target row", () => {
    const items = [item(), item({ id: "item_2", status: "pending" })];
    const next = applyDecision(items, "item_2", "approved", "Still needed");

    expect(next[0].status).toBe("pending");
    expect(next[1].status).toBe("approved");
    expect(next[1].notes).toBe("Still needed");
    expect(next[1].decidedAt).toBeTruthy();
  });

  it("trims note text when applying revoke decision", () => {
    const next = applyDecision([item()], "item_1", "revoked", "  remove access  ");
    expect(next[0].status).toBe("revoked");
    expect(next[0].notes).toBe("remove access");
  });
});
