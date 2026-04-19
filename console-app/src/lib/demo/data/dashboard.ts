import { DEMO_USER } from "./session.js";
import { hoursAgo, daysAgo, uuid } from "./helpers.js";

export function getDashboardResponse() {
  return {
    data: {
      tenant: {
        id: DEMO_USER.tenantId,
        name: "Acme Corp",
        slug: "acme-corp",
        tier: "pro",
        status: "active",
      },
      user: {
        id: DEMO_USER.userId,
        email: DEMO_USER.email,
        role: DEMO_USER.role,
      },
      stats: {
        evidenceCount: 247,
        automationRulesTotal: 3,
        automationRulesEnabled: 3,
        openIncidents: 1,
      },
      recentEvents: [
        {
          id: uuid(),
          type: "compliance.evidence.created",
          source: "okta",
          status: "processed",
          created_at: hoursAgo(2),
        },
        {
          id: uuid(),
          type: "automation.rule.executed",
          source: "orchestrator",
          status: "success",
          created_at: hoursAgo(6),
        },
        {
          id: uuid(),
          type: "incident.detected",
          source: "aws",
          status: "open",
          created_at: hoursAgo(4),
        },
        {
          id: uuid(),
          type: "directory.user.created",
          source: "okta",
          status: "processed",
          created_at: daysAgo(1),
        },
        {
          id: uuid(),
          type: "compliance.score.updated",
          source: "compliance-engine",
          status: "processed",
          created_at: daysAgo(2),
        },
      ],
    },
  };
}
