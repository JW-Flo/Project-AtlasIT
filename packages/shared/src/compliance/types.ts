// Shared compliance domain types (mirrors OpenAPI & worker)
export interface FrameworkSummary {
  framework: string;
  coveragePercent: number;
  passing: number;
  failing: number;
  total: number;
}

export type Severity = "low" | "medium" | "high" | "critical";

export interface Risk {
  id: string;
  title: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  score: number; // likelihood * impact (1-25)
  severity: Severity;
  owner?: string;
  severityOverride?: boolean;
}

export interface Policy {
  id: string;
  name: string;
  status: "draft" | "approved" | "outdated";
  updated: string; // ISO date
}

export interface ComplianceSnapshot {
  tenantId: string;
  generatedAt: string; // ISO date
  ageSeconds?: number;
  frameworkSummary: FrameworkSummary[];
  risks: Risk[];
  policies: Policy[];
}

export interface PolicyEvaluationRequest {
  tenantId: string;
  subject: Record<string, unknown>;
  policyPackRef: string;
  timestamp: string; // ISO date
}

export interface PolicyEvaluationResponse {
  result: {
    allow: boolean;
    requirements?: string[];
    violations?: string[];
  };
  evidence: {
    hash: string;
  };
}

export function deriveRiskScore(likelihood: number, impact: number) {
  return likelihood * impact;
}

export function deriveSeverity(score: number): Severity {
  if (score <= 5) return "low";
  if (score <= 10) return "medium";
  if (score <= 16) return "high";
  return "critical";
}
