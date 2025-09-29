import type { ComplianceSnapshot } from "./api/types";

export const mockSnapshot: ComplianceSnapshot = {
  generatedAt: new Date().toISOString(),
  frameworkSummary: [
    {
      framework: "SOC2",
      coveragePercent: 42.5,
      passing: 85,
      failing: 115,
      total: 200,
    },
    {
      framework: "ISO27001",
      coveragePercent: 31.2,
      passing: 50,
      failing: 110,
      total: 160,
    },
    {
      framework: "NIST CSF",
      coveragePercent: 55.4,
      passing: 120,
      failing: 96,
      total: 216,
    },
  ],
  risks: [
    {
      id: "R1",
      title: "Unpatched Server",
      severity: "high",
      likelihood: 4,
      impact: 4,
      owner: "ops@atlasit.local",
    },
    {
      id: "R2",
      title: "MFA Gaps",
      severity: "medium",
      likelihood: 3,
      impact: 3,
    },
    {
      id: "R3",
      title: "Vendor Access",
      severity: "critical",
      likelihood: 5,
      impact: 4,
      owner: "security@atlasit.local",
    },
  ],
  policies: [
    {
      id: "P1",
      name: "Access Control Policy",
      status: "draft",
      updated: new Date().toISOString(),
    },
    {
      id: "P2",
      name: "Incident Response Plan",
      status: "approved",
      updated: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "P3",
      name: "Vendor Management Policy",
      status: "outdated",
      updated: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ],
};
