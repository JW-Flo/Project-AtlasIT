import { json } from '@sveltejs/kit';

const GET = async ({ platform }) => {
  const env = platform?.env ?? {};
  if (env.DEMO_MODE !== "1" && env.DEMO_MODE !== "true") {
    return json(
      {
        error: "Mock endpoints are disabled. Set DEMO_MODE=1 to enable."
      },
      { status: 404 }
    );
  }
  const snapshot = {
    tenantId: "demo",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    _warning: "This is mock data for demonstration purposes only",
    frameworkSummary: [
      { framework: "SOC2", coveragePercent: 52, passing: 120, failing: 30, total: 200 },
      { framework: "ISO27001", coveragePercent: 41, passing: 80, failing: 40, total: 160 },
      { framework: "NIST CSF", coveragePercent: 55, passing: 120, failing: 96, total: 216 }
    ],
    risks: [
      {
        id: "R1",
        title: "Unpatched Server Infrastructure",
        severity: "high",
        likelihood: 4,
        impact: 4,
        score: 16
      },
      {
        id: "R2",
        title: "MFA Coverage Gaps",
        severity: "medium",
        likelihood: 3,
        impact: 3,
        score: 9
      },
      {
        id: "R3",
        title: "Third-Party Vendor Exposure",
        severity: "critical",
        likelihood: 5,
        impact: 4,
        score: 20
      }
    ]
  };
  return json(snapshot);
};

export { GET };
//# sourceMappingURL=_server.ts-BaXeGq9o.js.map
