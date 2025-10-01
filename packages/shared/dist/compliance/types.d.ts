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
  likelihood: number;
  impact: number;
  score: number;
  severity: Severity;
  owner?: string;
  severityOverride?: boolean;
}
export interface Policy {
  id: string;
  name: string;
  status: "draft" | "approved" | "outdated";
  updated: string;
}
export interface ComplianceSnapshot {
  tenantId: string;
  generatedAt: string;
  ageSeconds?: number;
  frameworkSummary: FrameworkSummary[];
  risks: Risk[];
  policies: Policy[];
}
export interface PolicyEvaluationRequest {
  tenantId: string;
  subject: Record<string, unknown>;
  policyPackRef: string;
  timestamp: string;
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
export declare function deriveRiskScore(
  likelihood: number,
  impact: number,
): number;
export declare function deriveSeverity(score: number): Severity;
//# sourceMappingURL=types.d.ts.map
