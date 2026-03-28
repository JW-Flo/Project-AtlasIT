/**
 * Compliance Intelligence Types
 *
 * Shared types for gap analysis, drift detection, anomaly detection,
 * and AI policy generation. These power Phase 13's proactive compliance
 * intelligence features.
 */

// ── Gap Analysis ─────────────────────────────────────────────────────────────

export type GapType = "missing" | "stale" | "failing";

export interface ComplianceGap {
  controlId: string;
  controlName: string;
  framework: string;
  gapType: GapType;
  /** ISO timestamp of last evidence, if any */
  lastEvidenceAt: string | null;
  /** Days since last evidence (null if no evidence) */
  staleDays: number | null;
  recommendation: string;
  priority: "critical" | "high" | "medium" | "low";
  /** Suggested action type to close the gap */
  suggestedAction: string | null;
}

export interface GapAnalysisResult {
  tenantId: string;
  frameworks: string[];
  gaps: ComplianceGap[];
  summary: GapSummary;
  analyzedAt: string;
}

export interface GapSummary {
  totalControls: number;
  coveredControls: number;
  missingCount: number;
  staleCount: number;
  failingCount: number;
  coveragePercent: number;
}

// ── Drift Detection ──────────────────────────────────────────────────────────

export type DriftAlertType =
  | "adapter_disconnected"
  | "adapter_health_failure"
  | "rule_disabled"
  | "evidence_expired"
  | "score_regression";

export interface DriftAlert {
  id: string;
  alertType: DriftAlertType;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  affectedControls: string[];
  affectedFrameworks: string[];
  suggestedRemediation: string;
  triggeredBy: string;
  detectedAt: string;
}

export interface DriftDetectionResult {
  tenantId: string;
  alerts: DriftAlert[];
  detectedAt: string;
}

// ── Risk Anomaly Detection ───────────────────────────────────────────────────

export type AnomalyType =
  | "bulk_privilege_escalation"
  | "off_hours_provisioning"
  | "sod_violation"
  | "unusual_revocation_volume"
  | "dormant_account_reactivation";

export interface RiskAnomaly {
  anomalyType: AnomalyType;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  affectedUsers: string[];
  affectedApps: string[];
  detectedAt: string;
  evidence: Record<string, unknown>;
}

// ── AI Policy Generation ─────────────────────────────────────────────────────

export type PolicyType =
  | "access_control"
  | "incident_response"
  | "data_handling"
  | "password"
  | "acceptable_use";

export interface PolicySection {
  title: string;
  content: string;
}

export interface GeneratedPolicy {
  title: string;
  type: PolicyType;
  sections: PolicySection[];
  generatedAt: string;
  basedOn: string[];
}

export interface PolicyDiffLine {
  lineNumber: number;
  type: "added" | "removed" | "unchanged";
  content: string;
}

// ── Stored Insight (D1 row shape) ────────────────────────────────────────────

export interface ComplianceInsight {
  id: string;
  tenantId: string;
  insightType: "gap" | "drift" | "anomaly";
  severity: "critical" | "high" | "medium" | "low";
  category: string | null;
  data: string;
  resolvedAt: string | null;
  createdAt: string;
}
