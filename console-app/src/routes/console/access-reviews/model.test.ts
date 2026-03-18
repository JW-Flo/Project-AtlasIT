import { describe, expect, it } from "vitest";
import {
  computeCampaignProgress,
  derivePendingItems,
  statusLabel,
  statusVariant,
  type AccessReviewCampaign,
} from "./model";

function campaign(overrides: Partial<AccessReviewCampaign> = {}): AccessReviewCampaign {
  return {
    id: "camp_1",
    name: "Q1 Engineering Access Review",
    scope: "all",
    status: "active",
    totalItems: 10,
    approvedItems: 6,
    revokedItems: 2,
    ...overrides,
  };
}

describe("access reviews model", () => {
  it("computes progress from reviewed/total items", () => {
    expect(computeCampaignProgress(campaign())).toBe(80);
  });

  it("returns 0 progress when totalItems is zero", () => {
    expect(computeCampaignProgress(campaign({ totalItems: 0 }))).toBe(0);
  });

  it("clamps progress to 100 when reviewed count exceeds total", () => {
    expect(
      computeCampaignProgress(
        campaign({ totalItems: 5, approvedItems: 4, revokedItems: 3 }),
      ),
    ).toBe(100);
  });

  it("derives pending from total minus approved and revoked", () => {
    expect(derivePendingItems(campaign())).toBe(2);
  });

  it("uses explicit pendingItems when provided by API", () => {
    expect(derivePendingItems(campaign({ pendingItems: 7 }))).toBe(7);
  });

  it("maps status to readable labels", () => {
    expect(statusLabel("draft")).toBe("Draft");
    expect(statusLabel("active")).toBe("Active");
    expect(statusLabel("completed")).toBe("Completed");
    expect(statusLabel("expired")).toBe("Expired");
  });

  it("maps status to badge variants", () => {
    expect(statusVariant("draft")).toBe("secondary");
    expect(statusVariant("active")).toBe("warning");
    expect(statusVariant("completed")).toBe("success");
    expect(statusVariant("expired")).toBe("destructive");
  });
});
