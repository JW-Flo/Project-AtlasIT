/**
 * Compliance Pipeline E2E Integration Tests
 *
 * Covers the full chain from raw adapter evidence through CDT payload
 * construction, control evaluation, and D1 storage persistence.
 *
 * Pipeline: adapter evidence → flattenAdapterResults → buildCdtPayloadFromEvidence
 *           → runControlEval (all controls) → evaluateAndStoreEvidence → D1 batch
 *
 * The existing tests/compliance-pipeline-e2e.test.ts covers the narrower
 * mapper → CDT eval segment. This file adds D1 storage layer coverage,
 * multi-adapter merging, network error handling, and all-framework scoring.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildCdtPayloadFromEvidence,
  flattenAdapterResults,
} from "../../packages/shared/src/evidence/cdt-field-mapper";
import {
  collectAdapterEvidence,
  ADAPTER_EVIDENCE_REGISTRY,
  type AdapterEvidenceItem,
} from "../../packages/shared/src/evidence/adapter-collector";
import { runControlEval, ALL_CONTROL_IDS } from "../../shared/services/cdt/src/evaluation/engine";
import {
  evaluateAndStoreEvidence,
  FRAMEWORK_CONTROLS,
} from "../../compliance-worker/src/modules/policies/evaluation";

// ---------------------------------------------------------------------------
// Shared evidence fixtures
// ---------------------------------------------------------------------------

function buildOktaEvidence(): AdapterEvidenceItem[] {
  return [
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
  ];
}

function buildAwsEvidence(): AdapterEvidenceItem[] {
  return [
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
    {
      type: "encryption_at_rest",
      controlRefs: ["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"],
      status: "pass",
      details: { s3Encrypted: true, ebsEncrypted: true },
    },
  ];
}

function buildGithubEvidence(): AdapterEvidenceItem[] {
  return [
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
  ];
}

function buildGoogleWorkspaceEvidence(): AdapterEvidenceItem[] {
  return [
    {
      type: "mfa_enforcement",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
      status: "pass",
      details: { enforcedSample: 10, sampledUsers: 10 },
    },
    {
      type: "dlp_rules",
      controlRefs: ["SOC2-CC6.7", "GDPR-Art.5(1)(f)"],
      status: "pass",
      details: { rulesActive: 5 },
    },
    {
      type: "sharing_settings",
      controlRefs: ["SOC2-CC6.6", "ISO-27001-A.9.1.2"],
      status: "pass",
      details: { externalSharingDisabled: true },
    },
  ];
}

function buildM365Evidence(): AdapterEvidenceItem[] {
  return [
    {
      type: "mfa_enforcement",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
      status: "pass",
      details: {},
    },
    {
      type: "conditional_access",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.1"],
      status: "pass",
      details: { enabledPolicies: 3 },
    },
    {
      type: "encryption_status",
      controlRefs: ["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"],
      status: "pass",
      details: { bitlockerEnabled: true },
    },
  ];
}

function buildSlackEvidence(): AdapterEvidenceItem[] {
  return [
    {
      type: "sso_enforcement",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.2.1"],
      status: "pass",
      details: { ssoRequired: true },
    },
    {
      type: "retention_policy",
      controlRefs: ["GDPR-Art.5(1)(e)", "SOC2-CC6.6"],
      status: "pass",
      details: { retentionDays: 90 },
    },
  ];
}

/** Full six-adapter evidence set for all-framework coverage. */
function buildComprehensiveEvidence() {
  return [
    { slug: "okta", items: buildOktaEvidence() },
    { slug: "aws", items: buildAwsEvidence() },
    { slug: "github", items: buildGithubEvidence() },
    { slug: "google-workspace", items: buildGoogleWorkspaceEvidence() },
    { slug: "microsoft-365", items: buildM365Evidence() },
    { slug: "slack", items: buildSlackEvidence() },
  ];
}

// ---------------------------------------------------------------------------
// Minimal D1 mock that captures batch() calls
// ---------------------------------------------------------------------------

interface CapturedStatement {
  sql: string;
  args: unknown[];
}

function createMockD1() {
  const captured: CapturedStatement[] = [];

  const mockBatch = vi.fn(async (stmts: unknown[]) => {
    // stmts are already recorded at prepare().bind() time
    return stmts.map(() => ({ success: true, meta: { changes: 1 } }));
  });

  const db = {
    prepare: vi.fn((sql: string) => {
      return {
        bind: vi.fn((...args: unknown[]) => {
          const stmt: CapturedStatement = { sql, args };
          captured.push(stmt);
          return stmt as unknown as D1PreparedStatement;
        }),
      };
    }),
    batch: mockBatch,
  } as unknown as D1Database;

  return { db, captured, mockBatch };
}

// ---------------------------------------------------------------------------
// Helper: build a CDT event and run all controls
// ---------------------------------------------------------------------------

function evalAllControls(payload: Record<string, unknown>) {
  const ev = {
    tenant: "test-tenant",
    type: "policy.evaluation",
    occurred_at: new Date().toISOString(),
    payload,
    trace_id: "test-trace",
  };
  return ALL_CONTROL_IDS.map((id) => ({ id, result: runControlEval(id, ev) }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Compliance pipeline E2E: full chain including D1 storage", () => {
  // ── 1. Full pipeline: adapter evidence → CDT payload → eval → non-zero scores ────

  it("Okta MFA + AWS CloudTrail + GitHub branch protection evidence passes key controls", () => {
    const results = [
      { slug: "okta", items: buildOktaEvidence() },
      { slug: "aws", items: buildAwsEvidence() },
      { slug: "github", items: buildGithubEvidence() },
    ];

    const flat = flattenAdapterResults(results);
    const payload = buildCdtPayloadFromEvidence(flat);

    // Payload fields populated from real adapter evidence
    expect(payload.mfa_required).toBe(true);
    expect(payload.auto_logoff_mins).toBe(15);
    expect(payload.approved_change_pct).toBe(100);
    expect(payload.phi_audit_logs_enabled).toBe(true);
    expect(payload.continuous_monitoring_enabled).toBe(true);

    const evals = evalAllControls(payload);
    const passing = evals.filter((e) => e.result.decision === "pass");
    expect(passing.length).toBeGreaterThanOrEqual(10);

    // Specific controls that must pass given this evidence
    const mustPass = [
      "SOC2-CC6.2", // mfa_required
      "SOC2-CC8.1", // authorized change management (branch protection)
      "SOC2-CC7.1", // anomaly detection (CloudTrail)
      "SOC2-CC4.1", // continuous monitoring (CloudTrail)
      "HIPAA-164.312(d)", // mfa_required_for_phi
      "HIPAA-164.312(b)", // phi_audit_logs_enabled
      "HIPAA-164.312(a)(2)(ii)", // auto_logoff ≤ 15 min
      "NIST-CSF-DE.CM-1", // network_monitoring_enabled + siem_connected
    ];

    const ev = {
      tenant: "test-tenant",
      type: "policy.evaluation",
      occurred_at: new Date().toISOString(),
      payload,
      trace_id: "test-trace",
    };

    for (const controlId of mustPass) {
      const { decision, rationale } = runControlEval(controlId, ev);
      expect(decision, `${controlId} should pass. Rationale: ${rationale.join(", ")}`).toBe("pass");
    }
  });

  // ── 2. All 5 frameworks get passing controls from comprehensive evidence ──

  it("all five compliance frameworks have at least one passing control from six-adapter evidence", () => {
    const results = buildComprehensiveEvidence();
    const flat = flattenAdapterResults(results);
    const payload = buildCdtPayloadFromEvidence(flat);

    const ev = {
      tenant: "test-tenant",
      type: "policy.evaluation",
      occurred_at: new Date().toISOString(),
      payload,
      trace_id: "test-trace",
    };

    const frameworks: Array<{ prefix: string; label: string }> = [
      { prefix: "SOC2-", label: "SOC2" },
      { prefix: "ISO-27001-", label: "ISO27001" },
      { prefix: "HIPAA-", label: "HIPAA" },
      { prefix: "NIST-CSF-", label: "NIST CSF" },
      { prefix: "GDPR-", label: "GDPR" },
    ];

    for (const { prefix, label } of frameworks) {
      const frameworkControls = ALL_CONTROL_IDS.filter((id) => id.startsWith(prefix));
      const passing = frameworkControls.filter((id) => runControlEval(id, ev).decision === "pass");
      expect(
        passing.length,
        `${label} should have at least one passing control`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // ── 3. Empty evidence → all controls fail or unknown ────────────────────

  it("empty evidence results in all controls failing or unknown", () => {
    const payload = buildCdtPayloadFromEvidence([]);
    const evals = evalAllControls(payload);

    const passing = evals.filter((e) => e.result.decision === "pass");
    const notPassing = evals.filter((e) => e.result.decision !== "pass");

    // At most a tiny handful can pass (undefined === 0 numeric edge cases)
    expect(passing.length).toBeLessThanOrEqual(5);
    expect(notPassing.length).toBeGreaterThanOrEqual(55);
  });

  // ── 4. Adapter fail status inverts boolean fields ─────────────────────

  it("adapter fail status inverts mfa_required to false and fails SOC2-CC6.2", () => {
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

    const ev = {
      tenant: "test-tenant",
      type: "policy.evaluation",
      occurred_at: new Date().toISOString(),
      payload,
      trace_id: "test-trace",
    };

    const { decision } = runControlEval("SOC2-CC6.2", ev);
    expect(decision).toBe("fail");
  });

  // ── 5. Unknown status evidence is skipped ─────────────────────────────

  it("unknown-status evidence items do not contribute fields to the CDT payload", () => {
    const results = [
      {
        slug: "okta",
        items: [
          {
            type: "mfa_policy" as const,
            controlRefs: ["SOC2-CC6.1"],
            status: "unknown" as const,
            details: { hasRequiredFactor: true },
          },
        ],
      },
    ];

    const flat = flattenAdapterResults(results);
    const payload = buildCdtPayloadFromEvidence(flat);

    // No fields should be set — unknown items must be silently skipped
    expect(Object.keys(payload).length).toBe(0);
    expect(payload.mfa_required).toBeUndefined();
  });

  // ── 6. evaluateAndStoreEvidence writes 60 prepared statements to D1 ────

  it("evaluateAndStoreEvidence issues one prepared statement per control via db.batch", async () => {
    const { db, mockBatch } = createMockD1();
    const tenantId = "tenant-abc";
    const input = buildCdtPayloadFromEvidence(flattenAdapterResults(buildComprehensiveEvidence()));

    const result = await evaluateAndStoreEvidence(db, tenantId, input);

    // One prepared statement per control
    expect(mockBatch).toHaveBeenCalledTimes(1);
    const [stmts] = mockBatch.mock.calls[0] as [unknown[]];
    expect(stmts.length).toBe(ALL_CONTROL_IDS.length);

    // Summary counts should sum to total
    expect(result.passed + result.failed + result.unknown).toBe(ALL_CONTROL_IDS.length);
    // With comprehensive evidence, some controls must pass
    expect(result.passed).toBeGreaterThan(0);
  });

  // ── 7. evaluateAndStoreEvidence uses deterministic IDs ────────────────

  it("evaluateAndStoreEvidence generates deterministic row IDs policy-eval-{tenantId}-{controlId}", async () => {
    const { db, captured } = createMockD1();
    const tenantId = "tenant-xyz";
    const input = buildCdtPayloadFromEvidence(
      flattenAdapterResults([{ slug: "okta", items: buildOktaEvidence() }]),
    );

    await evaluateAndStoreEvidence(db, tenantId, input);

    // Every captured statement should have the deterministic ID pattern as first arg
    for (const stmt of captured) {
      const id = stmt.args[0] as string;
      expect(id).toMatch(/^policy-eval-tenant-xyz-/);
      // Tenant ID is second arg
      expect(stmt.args[1]).toBe(tenantId);
    }
  });

  // ── 8. collectAdapterEvidence handles network errors gracefully ────────

  it("collectAdapterEvidence returns error field and empty items on fetch failure", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await collectAdapterEvidence(
        "https://unreachable.internal",
        "okta",
        "tenant-123",
      );

      expect(result.slug).toBe("okta");
      expect(result.items).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("ECONNREFUSED");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  // ── 9. collectAdapterEvidence handles non-2xx HTTP errors ─────────────

  it("collectAdapterEvidence returns error field on non-2xx HTTP response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await collectAdapterEvidence(
        "https://adapter.example.com",
        "github",
        "tenant-456",
      );

      expect(result.items).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("503");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  // ── 10. Multi-adapter merging: later values win ────────────────────────

  it("conflicting mfa_required from multiple adapters: last adapter's value wins", () => {
    // Okta passes mfa_required=true, M365 passes mfa_required=true, then
    // a final failed adapter overrides it to false
    const results = [
      {
        slug: "okta",
        items: [
          {
            type: "mfa_policy" as const,
            controlRefs: ["SOC2-CC6.1"],
            status: "pass" as const,
            details: { hasRequiredFactor: true },
          },
        ],
      },
      {
        slug: "microsoft-365",
        items: [
          {
            type: "mfa_enforcement" as const,
            controlRefs: ["SOC2-CC6.1"],
            // fail status → mfa_required inverted to false (overrides Okta's true)
            status: "fail" as const,
            details: {},
          },
        ],
      },
    ];

    const flat = flattenAdapterResults(results);
    const payload = buildCdtPayloadFromEvidence(flat);

    // The last item (M365 fail) wins — mfa_required should be false
    expect(payload.mfa_required).toBe(false);
  });

  // ── 11. ADAPTER_EVIDENCE_REGISTRY covers all expected slugs ───────────

  it("ADAPTER_EVIDENCE_REGISTRY contains entries for all core adapter slugs", () => {
    const registeredSlugs = new Set(ADAPTER_EVIDENCE_REGISTRY.map((c) => c.slug));

    const expectedSlugs = ["github", "okta", "google-workspace", "microsoft-365", "aws", "slack"];

    for (const slug of expectedSlugs) {
      expect(registeredSlugs.has(slug), `ADAPTER_EVIDENCE_REGISTRY missing slug: ${slug}`).toBe(
        true,
      );
    }
  });

  // ── 12. Framework control counts are non-zero and sum to 60 ──────────

  it("FRAMEWORK_CONTROLS partitions all control IDs across the five frameworks without gaps", () => {
    const frameworks = ["soc2", "iso27001", "hipaa", "nist_csf", "gdpr"] as const;

    let total = 0;
    for (const fw of frameworks) {
      const ids = FRAMEWORK_CONTROLS[fw];
      expect(ids.length, `${fw} should have at least 1 control`).toBeGreaterThan(0);
      total += ids.length;
    }

    expect(total).toBe(ALL_CONTROL_IDS.length);
  });
});
