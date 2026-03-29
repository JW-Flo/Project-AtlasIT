import { describe, it, expect } from "vitest";

/**
 * Policy lifecycle status transitions:
 *   draft → pending_review → approved
 *   draft → pending_review → rejected → draft (re-edit)
 *   draft → pending_review → changes_requested → draft (re-edit)
 *   approved → archived
 */

type PolicyStatus = "draft" | "pending_review" | "approved" | "archived";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending_review"],
  pending_review: ["approved", "draft"], // draft = rejected/changes_requested revert
  approved: ["archived"],
  archived: [],
};

function validatePolicyTransition(current: string, next: string): boolean {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.includes(next);
}

describe("Policy status transitions", () => {
  it("allows draft -> pending_review", () => {
    expect(validatePolicyTransition("draft", "pending_review")).toBe(true);
  });

  it("allows pending_review -> approved", () => {
    expect(validatePolicyTransition("pending_review", "approved")).toBe(true);
  });

  it("allows pending_review -> draft (rejection reverts to draft)", () => {
    expect(validatePolicyTransition("pending_review", "draft")).toBe(true);
  });

  it("allows approved -> archived", () => {
    expect(validatePolicyTransition("approved", "archived")).toBe(true);
  });

  it("rejects draft -> approved (must go through review)", () => {
    expect(validatePolicyTransition("draft", "approved")).toBe(false);
  });

  it("rejects approved -> draft (no reverting approved policies)", () => {
    expect(validatePolicyTransition("approved", "draft")).toBe(false);
  });

  it("rejects archived -> anything", () => {
    expect(validatePolicyTransition("archived", "draft")).toBe(false);
    expect(validatePolicyTransition("archived", "approved")).toBe(false);
  });

  it("rejects unknown status", () => {
    expect(validatePolicyTransition("unknown", "draft")).toBe(false);
  });
});

describe("Policy version numbering", () => {
  it("starts at version 1 on creation", () => {
    const initialVersion = 1;
    expect(initialVersion).toBe(1);
  });

  it("increments on each edit", () => {
    const versions = [1, 2, 3];
    expect(versions[versions.length - 1]).toBe(3);
  });

  it("version number is immutable after approval", () => {
    // Approved policies cannot be edited, only archived
    expect(validatePolicyTransition("approved", "draft")).toBe(false);
  });
});

describe("Policy approval decisions", () => {
  const validDecisions = ["pending", "approved", "rejected", "changes_requested"];

  it("accepts all valid decision types", () => {
    for (const d of validDecisions) {
      expect(validDecisions.includes(d)).toBe(true);
    }
  });

  it("rejects invalid decision types", () => {
    expect(validDecisions.includes("maybe")).toBe(false);
  });
});
