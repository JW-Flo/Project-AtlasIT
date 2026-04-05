import { describe, it, expect } from "vitest";
import { buildCdtPayloadFromEvidence, flattenAdapterResults } from "../cdt-field-mapper";
import type { AdapterEvidenceItem } from "../adapter-collector";

describe("buildCdtPayloadFromEvidence", () => {
  it("returns empty object when no items provided", () => {
    expect(buildCdtPayloadFromEvidence([])).toEqual({});
  });

  it("skips items with unknown status", () => {
    const items = [
      {
        slug: "okta",
        item: {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1"],
          status: "unknown" as const,
          details: { reason: "API scope missing" },
        },
      },
    ];
    expect(buildCdtPayloadFromEvidence(items)).toEqual({});
  });

  it("maps Okta MFA pass to mfa_required: true", () => {
    const items = [
      {
        slug: "okta",
        item: {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: { activePolicyCount: 2, hasRequiredFactor: true },
        },
      },
    ];
    const payload = buildCdtPayloadFromEvidence(items);
    expect(payload.mfa_required).toBe(true);
    expect(payload.mfa_required_for_phi).toBe(true);
  });

  it("maps Okta MFA fail to mfa_required: false", () => {
    const items = [
      {
        slug: "okta",
        item: {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1"],
          status: "fail" as const,
          details: { activePolicyCount: 0, hasRequiredFactor: false },
        },
      },
    ];
    const payload = buildCdtPayloadFromEvidence(items);
    expect(payload.mfa_required).toBe(false);
  });

  it("maps GitHub branch protection pass", () => {
    const items = [
      {
        slug: "github",
        item: {
          type: "branch_protection",
          controlRefs: ["SOC2-CC8.1"],
          status: "pass" as const,
          details: { allProtected: true, totalRepos: 5, protectedCount: 5 },
        },
      },
    ];
    const payload = buildCdtPayloadFromEvidence(items);
    expect(payload.approved_change_pct).toBe(100);
    expect(payload.unauthorized_changes_last_30d).toBe(0);
  });

  it("maps AWS CloudTrail pass to audit/monitoring fields", () => {
    const items = [
      {
        slug: "aws",
        item: {
          type: "cloudtrail_enabled",
          controlRefs: ["SOC2-CC7.1"],
          status: "pass" as const,
          details: {},
        },
      },
    ];
    const payload = buildCdtPayloadFromEvidence(items);
    expect(payload.phi_audit_logs_enabled).toBe(true);
    expect(payload.audit_log_retention_days).toBe(365);
    expect(payload.continuous_monitoring_enabled).toBe(true);
    expect(payload.network_monitoring_enabled).toBe(true);
  });

  it("maps Okta session policy to auto_logoff_mins", () => {
    const items = [
      {
        slug: "okta",
        item: {
          type: "session_policy",
          controlRefs: ["SOC2-CC6.7"],
          status: "pass" as const,
          details: { maxSessionIdleMinutes: 15 },
        },
      },
    ];
    const payload = buildCdtPayloadFromEvidence(items);
    expect(payload.auto_logoff_mins).toBe(15);
  });

  it("merges fields from multiple adapters — later overrides earlier", () => {
    const items = [
      {
        slug: "okta",
        item: {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: { hasRequiredFactor: true },
        },
      },
      {
        slug: "github",
        item: {
          type: "mfa_enforcement",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: { twoFactorRequired: true },
        },
      },
    ];
    const payload = buildCdtPayloadFromEvidence(items);
    // Both set mfa_required — GitHub (later) wins
    expect(payload.mfa_required).toBe(true);
  });

  it("maps Microsoft 365 conditional access to role-based access", () => {
    const items = [
      {
        slug: "microsoft-365",
        item: {
          type: "conditional_access",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: { enabledPolicies: 3, disabledPolicies: 1, totalPolicies: 4 },
        },
      },
    ];
    const payload = buildCdtPayloadFromEvidence(items);
    expect(payload.role_based_access_enforced).toBe(true);
    expect(payload.least_privilege_enforced).toBe(true);
  });

  it("skips items with unrecognized adapter:type keys", () => {
    const items = [
      {
        slug: "unknown-adapter",
        item: {
          type: "some_check",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: { foo: "bar" },
        },
      },
    ];
    expect(buildCdtPayloadFromEvidence(items)).toEqual({});
  });
});

describe("flattenAdapterResults", () => {
  it("flattens multiple adapters with multiple items", () => {
    const results = [
      {
        slug: "okta",
        items: [
          { type: "mfa_policy", controlRefs: ["SOC2-CC6.1"], status: "pass" as const, details: {} },
          {
            type: "password_policy",
            controlRefs: ["SOC2-CC6.1"],
            status: "pass" as const,
            details: {},
          },
        ],
      },
      {
        slug: "github",
        items: [
          {
            type: "branch_protection",
            controlRefs: ["SOC2-CC8.1"],
            status: "pass" as const,
            details: {},
          },
        ],
      },
    ];
    const flat = flattenAdapterResults(results);
    expect(flat).toHaveLength(3);
    expect(flat[0].slug).toBe("okta");
    expect(flat[2].slug).toBe("github");
  });

  it("returns empty array when all adapters returned empty", () => {
    const results = [
      { slug: "okta", items: [] },
      { slug: "github", items: [] },
    ];
    expect(flattenAdapterResults(results)).toHaveLength(0);
  });
});
