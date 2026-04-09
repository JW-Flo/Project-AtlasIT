/**
 * Compliance Gap Analyzer
 *
 * Continuously identifies which controls have stale, missing, or failing evidence
 * and recommends specific adapter connections or workflow changes to close gaps.
 *
 * Uses ACTION_COMPLIANCE_MAP to reverse-map controls → action types → remediation.
 */

import { ACTION_COMPLIANCE_MAP } from "../automation/compliance-mapping";
import type { ComplianceGap, GapAnalysisResult, GapSummary, GapType } from "./types";

/** Evidence staleness threshold in days */
const STALE_THRESHOLD_DAYS = 30;

/**
 * Simplified control catalog for gap analysis.
 * Maps framework → array of { controlId, controlName }.
 * This is the shared-package equivalent of console-app's FRAMEWORK_CONTROLS,
 * focused on controls that can be evidenced through automation.
 */
const ANALYZABLE_CONTROLS: Record<string, { controlId: string; controlName: string }[]> = {
  SOC2: [
    { controlId: "CC1.4", controlName: "Competence" },
    { controlId: "CC2.1", controlName: "Communication" },
    { controlId: "CC2.3", controlName: "Information Processing" },
    { controlId: "CC3.3", controlName: "Monitoring Changes" },
    { controlId: "CC3.4", controlName: "Change Impact" },
    { controlId: "CC4.1", controlName: "Ongoing Monitoring" },
    { controlId: "CC4.2", controlName: "Findings and Corrections" },
    { controlId: "CC5.1", controlName: "Control Activities Design" },
    { controlId: "CC5.2", controlName: "Segregation of Duties" },
    { controlId: "CC5.3", controlName: "Authorization Procedures" },
    { controlId: "CC6.1", controlName: "Access Control" },
    { controlId: "CC6.2", controlName: "MFA Enforcement" },
    { controlId: "CC6.3", controlName: "Logical Access Control" },
    { controlId: "CC6.4", controlName: "Logical Access Credentials" },
    { controlId: "CC6.5", controlName: "Logical Access Monitoring" },
    { controlId: "CC6.6", controlName: "Access Control Review" },
    { controlId: "CC6.7", controlName: "Access Termination" },
    { controlId: "CC7.1", controlName: "System Configuration" },
    { controlId: "CC7.2", controlName: "Anomalous Activity Monitoring" },
    { controlId: "CC7.3", controlName: "Incident Response Plan" },
    { controlId: "CC7.4", controlName: "Incident Response Procedures" },
    { controlId: "CC7.5", controlName: "Audit Log Retention and Review" },
    { controlId: "CC8.1", controlName: "Change Control Procedures" },
    { controlId: "CC9.2", controlName: "Third-Party Risk Management" },
  ],
  ISO27001: [
    { controlId: "A.5.1.1", controlName: "Information Security Policy Direction" },
    { controlId: "A.5.1.2", controlName: "Information Security Policy Review" },
    { controlId: "A.6.1.3", controlName: "Information Security Competence" },
    { controlId: "A.6.1.4", controlName: "Incident Responsibilities" },
    { controlId: "A.6.1.5", controlName: "Information Security Assessment" },
    { controlId: "A.7.3.1", controlName: "Termination Responsibilities" },
    { controlId: "A.9.1.1", controlName: "Access Control Policy" },
    { controlId: "A.9.1.2", controlName: "Access to Networks" },
    { controlId: "A.9.2.1", controlName: "User Registration" },
    { controlId: "A.9.2.2", controlName: "User Access Provisioning" },
    { controlId: "A.9.2.3", controlName: "Privileged Access Management" },
    { controlId: "A.9.2.5", controlName: "Review of User Access Rights" },
    { controlId: "A.9.2.6", controlName: "Removal of Access Rights" },
    { controlId: "A.9.3.1", controlName: "Use of Secret Authentication" },
    { controlId: "A.9.4.1", controlName: "Information Access Restriction" },
    { controlId: "A.9.4.2", controlName: "Secure Log-on (MFA)" },
    { controlId: "A.12.4.1", controlName: "Event Logging" },
    { controlId: "A.12.4.2", controlName: "Protection of Log Information" },
    { controlId: "A.12.4.3", controlName: "Admin and Operator Logs" },
    { controlId: "A.12.4.4", controlName: "Clock Synchronisation" },
    { controlId: "A.12.6.1", controlName: "Technical Vulnerability Management" },
    { controlId: "A.16.1.2", controlName: "Reporting Security Events" },
    { controlId: "A.16.1.4", controlName: "Assessment of Security Events" },
    { controlId: "A.16.1.5", controlName: "Response to Security Incidents" },
    { controlId: "A.16.1.6", controlName: "Learning from Incidents" },
    { controlId: "A.18.2.1", controlName: "Independent Security Review" },
  ],
  NIST_CSF: [
    { controlId: "PR.AC-1", controlName: "Identity & Credential Management" },
    { controlId: "PR.AC-3", controlName: "Remote Access Management" },
    { controlId: "PR.AC-4", controlName: "Least Privilege Enforcement" },
    { controlId: "PR.AC-5", controlName: "Segregation of Duties" },
    { controlId: "PR.DS-1", controlName: "Data-at-Rest Protection" },
    { controlId: "PR.DS-2", controlName: "Data-in-Transit Protection" },
    { controlId: "PR.IP-3", controlName: "Configuration Change Control" },
    { controlId: "DE.AE-3", controlName: "Event Correlation and Analysis" },
    { controlId: "DE.CM-1", controlName: "Network Monitoring" },
    { controlId: "DE.CM-3", controlName: "Personnel Activity Monitoring" },
    { controlId: "RS.CO-2", controlName: "Incidents Reported" },
    { controlId: "RS.AN-1", controlName: "Investigation and Notifications" },
  ],
  HIPAA: [
    { controlId: "164.312(a)(1)", controlName: "Access Control" },
    { controlId: "164.312(a)(2)(i)", controlName: "Unique User Identification" },
    { controlId: "164.312(a)(2)(ii)", controlName: "Emergency Access Procedure" },
    { controlId: "164.312(a)(2)(iii)", controlName: "Automatic Logoff" },
    { controlId: "164.312(a)(2)(iv)", controlName: "Encryption and Decryption" },
    { controlId: "164.312(b)", controlName: "Audit Controls" },
    { controlId: "164.312(c)(1)", controlName: "Integrity Controls" },
    { controlId: "164.312(d)", controlName: "Person or Entity Authentication" },
    { controlId: "164.312(e)(1)", controlName: "Transmission Security" },
    { controlId: "164.308(a)(1)(ii)(D)", controlName: "Information System Activity Review" },
    { controlId: "164.308(a)(5)(ii)(C)", controlName: "Log-in Monitoring" },
  ],
  GDPR: [
    { controlId: "Art.5(1)(a)", controlName: "Lawfulness, Fairness and Transparency" },
    { controlId: "Art.5(1)(b)", controlName: "Purpose Limitation" },
    { controlId: "Art.5(1)(c)", controlName: "Data Minimisation" },
    { controlId: "Art.5(1)(d)", controlName: "Accuracy" },
    { controlId: "Art.5(1)(e)", controlName: "Storage Limitation" },
    { controlId: "Art.5(1)(f)", controlName: "Integrity and Confidentiality" },
    { controlId: "Art.5(2)", controlName: "Accountability" },
    { controlId: "Art.17", controlName: "Right to Erasure" },
    { controlId: "Art.25", controlName: "Data Protection by Design" },
    { controlId: "Art.32", controlName: "Security of Processing" },
    { controlId: "Art.33", controlName: "Breach Notification" },
  ],
};

/** Reverse map: controlId → action types that generate evidence for it */
function buildReverseControlMap(): Map<string, string[]> {
  const reverseMap = new Map<string, string[]>();
  for (const [actionType, controls] of Object.entries(ACTION_COMPLIANCE_MAP)) {
    for (const ctrl of controls) {
      const existing = reverseMap.get(ctrl.controlId) ?? [];
      if (!existing.includes(actionType)) {
        existing.push(actionType);
      }
      reverseMap.set(ctrl.controlId, existing);
    }
  }
  return reverseMap;
}

const REVERSE_CONTROL_MAP = buildReverseControlMap();

const ACTION_RECOMMENDATIONS: Record<string, string> = {
  provision_app_access: "Set up auto-provisioning rules for connected apps",
  revoke_app_access: "Create offboarding rules to auto-revoke access on user departure",
  assign_role: "Configure role assignment automation for directory group changes",
  remove_role: "Add role removal rules for access control enforcement",
  run_workflow: "Create JML workflows for joiner/mover/leaver lifecycle events",
  create_incident: "Enable incident creation rules for compliance monitoring",
  sync_directory: "Set up directory sync automation for connected apps",
  update_compliance_status: "Configure compliance monitoring rules with score thresholds",
  send_notification: "Add notification rules for security event alerting",
  request_access_review: "Schedule periodic access review campaigns",
  rotate_nhi_credential: "Configure NHI credential rotation workflows",
  revoke_nhi_token: "Create NHI token revocation rules for decommissioned services",
};

/**
 * Control-specific recommendations for controls that aren't directly
 * covered by ACTION_COMPLIANCE_MAP (process controls, audit controls, etc.)
 */
const CONTROL_SPECIFIC_RECOMMENDATIONS: Record<string, string> = {
  // Audit log controls — identified as weak in compliance review
  "CC7.2":
    "Enable anomalous activity monitoring. Connect SIEM or log management adapter and configure anomaly detection rules",
  "CC7.5":
    "Establish audit log retention policy. Configure log storage with retention periods and tamper-proof archival in connected apps",
  "A.12.4.1":
    "Enable comprehensive event logging across all connected apps. Verify each adapter collects audit log evidence",
  "A.12.4.2":
    "Protect log information from tampering. Enable immutable log storage and configure access controls on log management systems",
  "A.12.4.3":
    "Collect administrator and operator activity logs from all connected apps with privileged access tracking",
  "A.12.4.4":
    "Enable NTP/clock synchronisation evidence from connected infrastructure. Verify timestamps are consistent across adapters",
  "A.12.6.1":
    "Connect vulnerability scanning tools (e.g., Snyk, Qualys) to collect technical vulnerability management evidence",

  // Access control depth — identified as needing more than "groups configured"
  "CC5.2":
    "Implement segregation of duties checks. Configure rules that flag when users hold conflicting roles across apps",
  "CC6.5":
    "Set up access monitoring rules. Create automation that detects and alerts on suspicious access patterns",
  "A.9.4.2":
    "Verify MFA enforcement evidence from identity providers. Connect Okta/M365/Google Workspace MFA policy data",
  "PR.AC-5":
    "Configure SoD (Separation of Duties) rules to detect conflicting access grants across connected apps",

  // Offboarding — identified as under-evidenced
  "CC6.7":
    "Create offboarding automation rules that revoke access across ALL connected apps, emit evidence, and create audit trail",
  "A.7.3.1":
    "Configure JML leaver workflows with session revocation, device wipe triggers, and shared credential rotation steps",

  // HIPAA-specific — need end-to-end audit evidence
  "164.312(b)":
    "Audit controls require evidence of log generation, retention, review, and anomaly detection across all PHI-relevant systems. Connect healthcare app adapters",
  "164.308(a)(1)(ii)(D)":
    "Configure regular information system activity review. Create scheduled automation rules to collect and review access logs",
  "164.308(a)(5)(ii)(C)":
    "Enable log-in monitoring evidence. Connect identity provider adapters and configure failed login alerting rules",
  "164.312(a)(2)(ii)":
    "Document emergency access (break-glass) procedures and create automation rules to track emergency access usage",
  "164.312(c)(1)":
    "Enable data integrity controls. Verify content-addressed evidence storage and hash verification are active",
  "164.312(e)(1)":
    "Verify TLS/encryption evidence from connected apps. Connect infrastructure adapters that report encryption status",

  // GDPR process controls
  "Art.5(2)":
    "Establish accountability records. Generate data processing activity logs and controller/processor documentation",
  "Art.25":
    "Document data protection by design measures. Generate policies covering privacy-first architecture decisions",
  "Art.32":
    "Verify security of processing controls. Collect encryption, access control, and pseudonymization evidence from connected apps",
  "Art.33":
    "Configure breach notification workflows. Create automation rules that detect potential breaches and trigger notification procedures",

  // NIST CSF detection and response
  "DE.AE-3":
    "Set up event correlation rules. Connect SIEM adapters and configure cross-app anomaly detection automation",
  "DE.CM-3":
    "Enable personnel activity monitoring. Create rules that track privileged user actions across connected apps",
  "RS.AN-1":
    "Configure investigation workflows. Create automation rules for incident triage with evidence collection from affected apps",
};

function buildRecommendation(
  controlId: string,
  controlName: string,
  gapType: GapType,
  staleDays: number | null,
): { recommendation: string; suggestedAction: string | null } {
  const actionTypes = REVERSE_CONTROL_MAP.get(controlId);
  const controlSpecific = CONTROL_SPECIFIC_RECOMMENDATIONS[controlId];

  if (gapType === "stale" && staleDays !== null) {
    const baseRec = `Evidence for ${controlName} (${controlId}) is ${staleDays} days old — trigger re-collection`;
    if (actionTypes?.length) {
      return {
        recommendation: `${baseRec}. ${ACTION_RECOMMENDATIONS[actionTypes[0]] ?? ""}`.trim(),
        suggestedAction: actionTypes[0],
      };
    }
    if (controlSpecific) {
      return { recommendation: `${baseRec}. ${controlSpecific}`, suggestedAction: null };
    }
    return { recommendation: baseRec, suggestedAction: null };
  }

  if (gapType === "failing") {
    const baseRec = `Evidence for ${controlName} (${controlId}) is failing — review adapter configuration or policy settings`;
    if (controlSpecific) {
      return {
        recommendation: `${baseRec}. ${controlSpecific}`,
        suggestedAction: actionTypes?.[0] ?? null,
      };
    }
    if (actionTypes?.length) {
      return { recommendation: baseRec, suggestedAction: actionTypes[0] };
    }
    return { recommendation: baseRec, suggestedAction: null };
  }

  // missing — use control-specific recommendation if available
  if (controlSpecific) {
    return {
      recommendation: `No evidence for ${controlName} (${controlId}). ${controlSpecific}`,
      suggestedAction: actionTypes?.[0] ?? null,
    };
  }

  if (actionTypes?.length) {
    const primaryAction = actionTypes[0];
    return {
      recommendation: `No evidence for ${controlName} (${controlId}). ${ACTION_RECOMMENDATIONS[primaryAction] ?? `Create automation rules with "${primaryAction}" actions`}`,
      suggestedAction: primaryAction,
    };
  }

  return {
    recommendation: `No evidence for ${controlName} (${controlId}). Connect relevant adapters or upload manual evidence to demonstrate compliance`,
    suggestedAction: null,
  };
}

function assignPriority(
  gapType: GapType,
  controlId: string,
): "critical" | "high" | "medium" | "low" {
  // Failing evidence is highest priority — active non-compliance
  if (gapType === "failing") return "critical";

  // Access control gaps (CC6.x, A.9.x, PR.AC-x) are high priority
  const accessControlPrefixes = ["CC6.", "A.9.", "PR.AC-", "164.312"];
  if (accessControlPrefixes.some((p) => controlId.startsWith(p))) {
    return gapType === "missing" ? "high" : "medium";
  }

  // Incident response gaps are high priority
  if (controlId.startsWith("CC7.") || controlId.startsWith("A.16.") || controlId === "RS.CO-2") {
    return gapType === "missing" ? "high" : "medium";
  }

  return gapType === "missing" ? "medium" : "low";
}

interface EvidenceRow {
  framework: string;
  control_id: string;
  latest_at: string;
  evidence_count: number;
  latest_status: string | null;
}

/**
 * Analyze compliance gaps for a tenant across selected frameworks.
 *
 * Queries compliance_evidence for the latest evidence per control,
 * then flags controls with missing, stale, or failing evidence.
 */
export async function analyzeComplianceGaps(
  db: any,
  tenantId: string,
  frameworks: string[],
): Promise<GapAnalysisResult> {
  if (frameworks.length === 0) {
    return {
      tenantId,
      frameworks: [],
      gaps: [],
      summary: {
        totalControls: 0,
        coveredControls: 0,
        missingCount: 0,
        staleCount: 0,
        failingCount: 0,
        coveragePercent: 0,
      },
      analyzedAt: new Date().toISOString(),
    };
  }

  // Query latest evidence per framework+control for this tenant
  const { results: evidenceRows } = await db
    .prepare(
      `SELECT framework, control_id,
              MAX(created_at) AS latest_at,
              COUNT(*) AS evidence_count,
              (SELECT CASE
                 WHEN metadata LIKE '%"status":"fail"%' THEN 'fail'
                 ELSE 'pass'
               END
               FROM compliance_evidence ce2
               WHERE ce2.tenant_id = compliance_evidence.tenant_id
                 AND ce2.framework = compliance_evidence.framework
                 AND ce2.control_id = compliance_evidence.control_id
               ORDER BY ce2.created_at DESC LIMIT 1) AS latest_status
       FROM compliance_evidence
       WHERE tenant_id = ?
       GROUP BY framework, control_id`,
    )
    .bind(tenantId)
    .all();

  // Build lookup: "framework:controlId" → evidence row
  const evidenceMap = new Map<string, EvidenceRow>();
  for (const row of (evidenceRows ?? []) as EvidenceRow[]) {
    evidenceMap.set(`${row.framework}:${row.control_id}`, row);
  }

  const now = Date.now();
  const gaps: ComplianceGap[] = [];
  let totalControls = 0;
  let coveredControls = 0;
  let missingCount = 0;
  let staleCount = 0;
  let failingCount = 0;

  for (const framework of frameworks) {
    const controls = ANALYZABLE_CONTROLS[framework];
    if (!controls) continue;

    for (const control of controls) {
      totalControls++;
      const key = `${framework}:${control.controlId}`;
      const evidence = evidenceMap.get(key);

      if (!evidence) {
        // No evidence at all
        missingCount++;
        const { recommendation, suggestedAction } = buildRecommendation(
          control.controlId,
          control.controlName,
          "missing",
          null,
        );
        gaps.push({
          controlId: control.controlId,
          controlName: control.controlName,
          framework,
          gapType: "missing",
          lastEvidenceAt: null,
          staleDays: null,
          recommendation,
          priority: assignPriority("missing", control.controlId),
          suggestedAction,
        });
        continue;
      }

      // Check if evidence is failing
      if (evidence.latest_status === "fail") {
        failingCount++;
        const daysSince = Math.floor(
          (now - new Date(evidence.latest_at).getTime()) / (24 * 60 * 60 * 1000),
        );
        const { recommendation, suggestedAction } = buildRecommendation(
          control.controlId,
          control.controlName,
          "failing",
          daysSince,
        );
        gaps.push({
          controlId: control.controlId,
          controlName: control.controlName,
          framework,
          gapType: "failing",
          lastEvidenceAt: evidence.latest_at,
          staleDays: daysSince,
          recommendation,
          priority: assignPriority("failing", control.controlId),
          suggestedAction,
        });
        continue;
      }

      // Check staleness
      const daysSince = Math.floor(
        (now - new Date(evidence.latest_at).getTime()) / (24 * 60 * 60 * 1000),
      );

      if (daysSince > STALE_THRESHOLD_DAYS) {
        staleCount++;
        const { recommendation, suggestedAction } = buildRecommendation(
          control.controlId,
          control.controlName,
          "stale",
          daysSince,
        );
        gaps.push({
          controlId: control.controlId,
          controlName: control.controlName,
          framework,
          gapType: "stale",
          lastEvidenceAt: evidence.latest_at,
          staleDays: daysSince,
          recommendation,
          priority: assignPriority("stale", control.controlId),
          suggestedAction,
        });
        continue;
      }

      // Control is covered — recent evidence and passing
      coveredControls++;
    }
  }

  const summary: GapSummary = {
    totalControls,
    coveredControls,
    missingCount,
    staleCount,
    failingCount,
    coveragePercent: totalControls > 0 ? Math.round((coveredControls / totalControls) * 100) : 0,
  };

  return {
    tenantId,
    frameworks,
    gaps,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}

/** Exported for testing and reuse by drift detector */
export { ANALYZABLE_CONTROLS, REVERSE_CONTROL_MAP };
