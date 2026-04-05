import { describe, it, expect } from "vitest";
import { runControlEval, ALL_CONTROL_IDS } from "../shared/services/cdt/src/evaluation/engine";
import {
  buildCdtPayloadFromEvidence,
  flattenAdapterResults,
} from "../packages/shared/src/evidence/cdt-field-mapper";
import { ALL_CONTROLS } from "../compliance-worker/src/modules/policies/cdt-rules";
import type { AdapterEvidenceItem } from "../packages/shared/src/evidence/adapter-collector";

/**
 * Simulates realistic adapter evidence from a tenant with Okta, GitHub,
 * Google Workspace, and AWS connected. This proves the full pipeline:
 *   adapter evidence → CDT field mapper → CDT rule evaluation → non-zero scores
 */
function buildRealisticEvidence(): Array<{ slug: string; items: AdapterEvidenceItem[] }> {
  return [
    {
      slug: "okta",
      items: [
        {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
          status: "pass",
          details: { activePolicyCount: 2, hasRequiredFactor: true },
        },
        {
          type: "password_policy",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.3.1"],
          status: "pass",
          details: { minLength: 12, minUpperCase: 1, minNumber: 1 },
        },
        {
          type: "session_policy",
          controlRefs: ["SOC2-CC6.7", "ISO-27001-A.9.4.2"],
          status: "pass",
          details: { maxSessionIdleMinutes: 15 },
        },
      ],
    },
    {
      slug: "github",
      items: [
        {
          type: "branch_protection",
          controlRefs: ["SOC2-CC8.1", "ISO-27001-A.12.6.1"],
          status: "pass",
          details: { allProtected: true, totalRepos: 10, protectedCount: 10 },
        },
        {
          type: "mfa_enforcement",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
          status: "pass",
          details: { org: "acme", twoFactorRequired: true },
        },
        {
          type: "sso_enforcement",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.2.1"],
          status: "pass",
          details: { org: "acme", samlSsoEnabled: true, samlSsoRequired: true },
        },
      ],
    },
    {
      slug: "google-workspace",
      items: [
        {
          type: "mfa_enforcement",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
          status: "pass",
          details: { enforcedSample: 10, sampledUsers: 10 },
        },
      ],
    },
    {
      slug: "aws",
      items: [
        {
          type: "mfa_enforcement",
          controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2"],
          status: "pass",
          details: { accountMFAEnabled: true, service: "iam" },
        },
        {
          type: "cloudtrail_enabled",
          controlRefs: ["SOC2-CC7.1", "HIPAA-164.312(b)", "NIST-CSF-DE.CM-1"],
          status: "pass",
          details: { service: "cloudtrail" },
        },
      ],
    },
  ];
}

describe("Compliance pipeline E2E: evidence → mapper → CDT eval", () => {
  it("ALL_CONTROLS covers all 60 IDs from ALL_CONTROL_IDS", () => {
    // Every control in the engine must have a matching definition in cdt-rules
    const definedIds = new Set(ALL_CONTROLS.map((c) => c.controlId));

    for (const fullId of ALL_CONTROL_IDS) {
      // Parse short ID the same way evaluation.ts does
      let shortId: string;
      if (fullId.startsWith("SOC2-")) shortId = fullId.slice(5);
      else if (fullId.startsWith("ISO-27001-")) shortId = fullId.slice(10);
      else if (fullId.startsWith("HIPAA-")) shortId = fullId.slice(6);
      else if (fullId.startsWith("NIST-CSF-")) shortId = fullId.slice(9);
      else if (fullId.startsWith("GDPR-")) shortId = fullId.slice(5);
      else shortId = fullId;

      expect(
        definedIds.has(shortId),
        `ALL_CONTROLS missing definition for ${fullId} (short: ${shortId})`,
      ).toBe(true);
    }
  });

  it("realistic adapter evidence produces non-zero CDT evaluations", () => {
    const results = buildRealisticEvidence();
    const flat = flattenAdapterResults(results);
    const payload = buildCdtPayloadFromEvidence(flat);

    // The payload should have real fields now
    expect(payload.mfa_required).toBe(true);
    expect(payload.auto_logoff_mins).toBe(15);
    expect(payload.approved_change_pct).toBe(100);
    expect(payload.phi_audit_logs_enabled).toBe(true);

    // Run all 60 CDT rules against the evidence-built payload
    const event = {
      tenant: "test-tenant",
      type: "policy.evaluation",
      occurred_at: new Date().toISOString(),
      payload,
      trace_id: "test-trace",
    };

    let passed = 0;
    let failed = 0;
    const passingControls: string[] = [];
    const failingControls: string[] = [];

    for (const controlId of ALL_CONTROL_IDS) {
      const result = runControlEval(controlId, event);
      if (result.decision === "pass") {
        passed++;
        passingControls.push(controlId);
      } else {
        failed++;
        failingControls.push(controlId);
      }
    }

    // With Okta + GitHub + Google Workspace + AWS evidence, we should pass
    // at least 10 controls (MFA, branch protection, audit logging, etc.)
    expect(passed).toBeGreaterThanOrEqual(10);

    // Specific controls that should definitely pass with this evidence:
    const expectedPassing = [
      "SOC2-CC6.2", // mfa_required
      "SOC2-CC8.1", // unauthorized_changes_last_30d === 0
      "SOC2-CC7.1", // anomaly_detection_enabled
      "SOC2-CC4.1", // continuous_monitoring_enabled
      "HIPAA-164.312(d)", // mfa_required_for_phi
      "HIPAA-164.312(b)", // phi_audit_logs_enabled
      "HIPAA-164.312(a)(2)(ii)", // auto_logoff_mins <= 15
      "NIST-CSF-DE.CM-1", // network_monitoring_enabled + siem_connected
    ];

    for (const id of expectedPassing) {
      const result = runControlEval(id, event);
      expect(
        result.decision,
        `Expected ${id} to pass but got ${result.decision}: ${result.rationale.join(", ")}`,
      ).toBe("pass");
    }
  });

  it("empty evidence produces all-fail CDT evaluations (previous broken state)", () => {
    const payload = buildCdtPayloadFromEvidence([]);
    const event = {
      tenant: "test-tenant",
      type: "policy.evaluation",
      occurred_at: new Date().toISOString(),
      payload,
      trace_id: "test-trace",
    };

    let passed = 0;
    let failed = 0;
    for (const controlId of ALL_CONTROL_IDS) {
      const result = runControlEval(controlId, event);
      if (result.decision === "pass") passed++;
      else failed++;
    }
    // With empty payload, very few rules should pass (some rules may
    // pass on undefined due to === 0 checks on numeric fields like
    // unauthorized_changes_last_30d, open_critical_incidents, etc.)
    // The important thing is that the vast majority fail.
    expect(passed).toBeLessThanOrEqual(5);
    expect(failed).toBeGreaterThanOrEqual(55);
  });

  it("adapter fail status correctly inverts boolean fields", () => {
    const results = [
      {
        slug: "okta",
        items: [
          {
            type: "mfa_policy" as const,
            controlRefs: ["SOC2-CC6.1"],
            status: "fail" as const,
            details: { hasRequiredFactor: false },
          },
        ],
      },
    ];
    const flat = flattenAdapterResults(results);
    const payload = buildCdtPayloadFromEvidence(flat);
    expect(payload.mfa_required).toBe(false);

    const event = {
      tenant: "test-tenant",
      type: "policy.evaluation",
      occurred_at: new Date().toISOString(),
      payload,
      trace_id: "test-trace",
    };
    const result = runControlEval("SOC2-CC6.2", event);
    expect(result.decision).toBe("fail");
  });
});
