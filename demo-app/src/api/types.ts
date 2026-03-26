export interface ComplianceSnapshot {
  generatedAt: string;
  frameworkSummary: Array<{
    framework: string;
    coveragePercent: number; // 0-100
    passing: number;
    failing: number;
    total: number;
  }>;
  risks: Array<{
    id: string;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    likelihood: number; // 1-5
    impact: number; // 1-5
    owner?: string;
  }>;
  policies: Array<{
    id: string;
    name: string;
    status: "draft" | "approved" | "outdated";
    updated: string;
  }>;
}
