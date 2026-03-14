import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
  const snapshot = {
    tenantId: "demo",
    generatedAt: new Date().toISOString(),
    frameworkSummary: [
      {
        framework: "SOC2",
        coveragePercent: 52,
        passing: 120,
        failing: 30,
        total: 200,
      },
      {
        framework: "ISO27001",
        coveragePercent: 41,
        passing: 80,
        failing: 40,
        total: 160,
      },
      {
        framework: "NIST CSF",
        coveragePercent: 55,
        passing: 120,
        failing: 96,
        total: 216,
      },
    ],
    risks: [
      {
        id: "R1",
        title: "Unpatched Server Infrastructure",
        severity: "high",
        likelihood: 4,
        impact: 4,
        score: 16,
        owner: "ops@atlasit.local",
      },
      {
        id: "R2",
        title: "MFA Coverage Gaps",
        severity: "medium",
        likelihood: 3,
        impact: 3,
        score: 9,
      },
      {
        id: "R3",
        title: "Third-Party Vendor Exposure",
        severity: "critical",
        likelihood: 5,
        impact: 4,
        score: 20,
        owner: "security@atlasit.local",
      },
    ],
    policies: [
      {
        id: "P1",
        name: "SOC 2 Access Control Policy",
        status: "approved",
        updated: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "P2",
        name: "ISO 27001 ISMS Policy",
        status: "approved",
        updated: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: "P3",
        name: "NIST CSF Policy",
        status: "draft",
        updated: new Date().toISOString(),
      },
      {
        id: "P4",
        name: "HIPAA Security Rule Policy",
        status: "draft",
        updated: new Date().toISOString(),
      },
      {
        id: "P5",
        name: "Data Protection & Privacy Policy",
        status: "approved",
        updated: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ],
  };
  return new Response(JSON.stringify(snapshot), {
    headers: { "Content-Type": "application/json" },
  });
};
