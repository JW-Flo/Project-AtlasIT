import { uuid, hoursAgo, minutesAgo } from "./helpers";

export function getDashboardResponse() {
  return {
    data: {
      tenant: {
        id: "demo-tenant-001",
        name: "Acme Corp",
        slug: "acme-corp",
        tier: "pro",
        status: "active",
      },
      user: { id: "demo-user-001", email: "alex@acmecorp.io", role: "admin" },
      stats: {
        evidenceCount: 247,
        automationRulesTotal: 3,
        automationRulesEnabled: 3,
        openIncidents: 1,
      },
      recentEvents: [
        {
          id: uuid(),
          type: "compliance.score_updated",
          source: "scheduler",
          status: "processed",
          created_at: minutesAgo(12),
        },
        {
          id: uuid(),
          type: "directory.user_synced",
          source: "okta",
          status: "processed",
          created_at: minutesAgo(28),
        },
        {
          id: uuid(),
          type: "automation.rule_executed",
          source: "engine",
          status: "processed",
          created_at: hoursAgo(1),
        },
        {
          id: uuid(),
          type: "evidence.collected",
          source: "github",
          status: "processed",
          created_at: hoursAgo(2),
        },
        {
          id: uuid(),
          type: "incident.created",
          source: "compliance-api",
          status: "processed",
          created_at: hoursAgo(4),
        },
      ],
    },
  };
}
