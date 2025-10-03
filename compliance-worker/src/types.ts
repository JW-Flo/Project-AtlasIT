export interface FrameworkSummary {
  framework: string;
  coveragePercent: number;
  passing: number;
  failing: number;
  total: number;
}

export interface Risk {
  id: string;
  title: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  score: number; // likelihood * impact
  severity: "low" | "medium" | "high" | "critical";
  owner?: string;
}

export interface Policy {
  id: string;
  name: string;
  status: "draft" | "approved" | "outdated";
  updated: string; // ISO
}

export interface ComplianceSnapshot {
  tenantId: string;
  generatedAt: string; // ISO
  ageSeconds?: number;
  frameworkSummary: FrameworkSummary[];
  risks: Risk[];
  policies: Policy[];
}

export function deriveRiskScore(likelihood: number, impact: number) {
  return likelihood * impact;
}

export function deriveSeverity(score: number): Risk["severity"] {
  if (score <= 5) return "low";
  if (score <= 10) return "medium";
  if (score <= 16) return "high";
  return "critical";
}

export interface EvidenceIngestRequest {
  tenantId?: string;
  pack?: string;
  subject?: string;
  payload: Record<string, unknown>;
}

export interface EvidenceIndexRow {
  id: number;
  hash: string;
  tenantId: string;
  pack: string;
  subject?: string | null;
  createdAt: string;
}
