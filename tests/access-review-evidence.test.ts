import { describe, it, expect } from "vitest";
import { classifyEvent } from "../packages/shared/src/evidence/classifier";

describe("access review evidence classification", () => {
  it("classifies access_review.completed as positive evidence for SOC2 CC6.1", () => {
    const result = classifyEvent(
      "tenant-1",
      "access_review.completed",
      "access-reviews",
      "admin@example.com",
      null,
      {
        campaignId: "campaign-1",
        totalItems: 10,
        approvedItems: 8,
        revokedItems: 2,
      },
    );

    expect(result).not.toBeNull();
    expect(result!.controls.length).toBeGreaterThan(0);

    const soc2CC61 = result!.controls.find(
      (c) => c.controlId === "CC6.1" && c.framework === "SOC2",
    );
    expect(soc2CC61).toBeDefined();
    expect(soc2CC61!.impact).toBe("positive");
    expect(soc2CC61!.category).toBe("access_review");
  });

  it("classifies access_review.completed as positive evidence for ISO27001 A.9.2.5", () => {
    const result = classifyEvent(
      "tenant-1",
      "access_review.completed",
      "access-reviews",
      "system",
      null,
      { campaignId: "campaign-1" },
    );

    expect(result).not.toBeNull();
    const isoA925 = result!.controls.find(
      (c) => c.controlId === "A.9.2.5" && c.framework === "ISO27001",
    );
    expect(isoA925).toBeDefined();
    expect(isoA925!.impact).toBe("positive");
  });

  it("classifies access_review.expired as detrimental evidence", () => {
    const result = classifyEvent(
      "tenant-1",
      "access_review.expired",
      "access-review-auto-revoke",
      "system",
      null,
      { campaignId: "campaign-1", revoked: 3, skipped: 1 },
    );

    expect(result).not.toBeNull();
    expect(result!.controls.length).toBeGreaterThan(0);

    // Expired reviews are detrimental — indicates gap in periodic review
    const detrimental = result!.controls.filter(
      (c) => c.impact === "detrimental",
    );
    expect(detrimental.length).toBeGreaterThan(0);
  });

  it("returns null for unrelated event types", () => {
    const result = classifyEvent(
      "tenant-1",
      "billing.invoice.created",
      "billing",
      "system",
      null,
      {},
    );
    expect(result).toBeNull();
  });
});
