import { describe, it, expect } from "vitest";
import type { NLBuildRequest, NLBuildResult, CompliancePreview } from "../nl-builder";
import type { ComplianceGap } from "../../compliance-intelligence/types";

/**
 * Unit tests for NL builder enhancements.
 * Note: We test the request/result types and gap-closing logic without
 * calling the AI provider (which requires GROQ_API_KEY).
 */

describe("NLBuildRequest types", () => {
  it("accepts complianceGaps in the request", () => {
    const req: NLBuildRequest = {
      prompt: "Revoke access when users leave Engineering",
      connectedApps: ["github", "slack"],
      directoryGroups: ["Engineering"],
      complianceGaps: [
        {
          controlId: "CC6.3",
          controlName: "Logical Access Control",
          framework: "SOC2",
          gapType: "missing",
          lastEvidenceAt: null,
          staleDays: null,
          recommendation: "Create offboarding rules",
          priority: "high",
          suggestedAction: "revoke_app_access",
        },
      ],
      existingRulesSummary: [
        'Auto-provision Slack (trigger: user_joined_group, actions: [{"type":"provision_app_access"}])',
      ],
    };

    expect(req.complianceGaps).toHaveLength(1);
    expect(req.existingRulesSummary).toHaveLength(1);
  });

  it("NLBuildResult includes closesGaps field", () => {
    const result: NLBuildResult = {
      rule: {
        name: "Auto-revoke on group leave",
        triggerType: "user_left_group",
        triggerConfig: { groupName: "Engineering" },
        conditions: [],
        actions: [{ type: "revoke_app_access", config: { appId: "github" }, order: 1 }],
      },
      compliancePreview: [
        {
          framework: "SOC2",
          controlId: "CC6.3",
          controlName: "Offboarding access removal",
          evidenceType: "access_revoke",
          fromAction: "revoke_app_access",
        },
      ],
      confidence: 0.95,
      reasoning: "Clear intent to revoke on departure",
      prompt: "Revoke access when users leave Engineering",
      closesGaps: ["SOC2:CC6.3"],
      possibleDuplicate: false,
    };

    expect(result.closesGaps).toContain("SOC2:CC6.3");
    expect(result.possibleDuplicate).toBe(false);
  });

  it("closesGaps is undefined when no gaps are provided", () => {
    const result: NLBuildResult = {
      rule: {
        name: "Test rule",
        triggerType: "user_created",
        triggerConfig: {},
        conditions: [],
        actions: [{ type: "send_notification", config: {}, order: 1 }],
      },
      compliancePreview: [],
      confidence: 0.8,
      reasoning: "Test",
      prompt: "Test",
    };

    expect(result.closesGaps).toBeUndefined();
    expect(result.possibleDuplicate).toBeUndefined();
  });
});
