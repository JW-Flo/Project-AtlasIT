import { daysAgo, hoursAgo, uuid } from "./helpers.js";

const CONNECTED_APP_IDS = [
  "okta",
  "aws",
  "github",
  "jira",
  "google-workspace",
  "slack",
  "microsoft365",
  "zoom",
  "bamboohr",
  "datadog",
  "pagerduty",
  "confluence",
];

export function getIntegrationsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          provider: "okta",
          status: "connected",
          created_at: daysAgo(180),
          updated_at: hoursAgo(6),
        },
        {
          id: uuid(),
          provider: "aws",
          status: "connected",
          created_at: daysAgo(180),
          updated_at: hoursAgo(12),
        },
        {
          id: uuid(),
          provider: "github",
          status: "connected",
          created_at: daysAgo(180),
          updated_at: hoursAgo(3),
        },
        {
          id: uuid(),
          provider: "jira",
          status: "connected",
          created_at: daysAgo(150),
          updated_at: hoursAgo(24),
        },
        {
          id: uuid(),
          provider: "google-workspace",
          status: "connected",
          created_at: daysAgo(180),
          updated_at: hoursAgo(8),
        },
        {
          id: uuid(),
          provider: "slack",
          status: "connected",
          created_at: daysAgo(120),
          updated_at: hoursAgo(2),
        },
        {
          id: uuid(),
          provider: "microsoft365",
          status: "connected",
          created_at: daysAgo(90),
          updated_at: hoursAgo(18),
        },
        {
          id: uuid(),
          provider: "zoom",
          status: "connected",
          created_at: daysAgo(60),
          updated_at: daysAgo(1),
        },
        {
          id: uuid(),
          provider: "bamboohr",
          status: "connected",
          created_at: daysAgo(30),
          updated_at: daysAgo(2),
        },
        {
          id: uuid(),
          provider: "datadog",
          status: "connected",
          created_at: daysAgo(45),
          updated_at: hoursAgo(4),
        },
        {
          id: uuid(),
          provider: "pagerduty",
          status: "warning",
          created_at: daysAgo(75),
          updated_at: hoursAgo(36),
        },
        {
          id: uuid(),
          provider: "confluence",
          status: "connected",
          created_at: daysAgo(100),
          updated_at: daysAgo(3),
        },
      ],
    },
  };
}

export function getAppsStatusResponse() {
  return {
    applications: CONNECTED_APP_IDS.map((id, index) => ({
      id,
      connected: true,
      healthy: id !== "pagerduty", // PagerDuty has warning status
    })),
  };
}

export { CONNECTED_APP_IDS };
