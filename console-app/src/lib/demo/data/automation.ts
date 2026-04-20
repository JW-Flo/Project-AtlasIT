// console-app/src/lib/demo/data/automation.ts
import { uuid, daysAgo, hoursAgo } from "./helpers";

export function getAutomationRulesResponse() {
  return {
    data: [
      {
        id: "rule-mfa",
        name: "Enforce MFA on New Users",
        description:
          "When a new user is provisioned, verify MFA enrollment within 48 hours. Alert security team if not enrolled.",
        trigger_type: "user.created",
        enabled: true,
        run_count: 34,
        error_count: 0,
        last_run_at: hoursAgo(3),
        last_status: "success",
        created_at: daysAgo(45),
      },
      {
        id: "rule-offboard",
        name: "Auto-Revoke on Offboarding",
        description:
          "When a user is deactivated in the directory, automatically revoke all app access and disable SSO sessions.",
        trigger_type: "user.deactivated",
        enabled: true,
        run_count: 8,
        error_count: 1,
        last_run_at: daysAgo(3),
        last_status: "success",
        created_at: daysAgo(40),
      },
      {
        id: "rule-access-review",
        name: "Quarterly Access Review Trigger",
        description:
          "Every 90 days, create a new access review campaign for all active users and notify managers.",
        trigger_type: "schedule.cron",
        enabled: true,
        run_count: 2,
        error_count: 0,
        last_run_at: daysAgo(12),
        last_status: "success",
        created_at: daysAgo(60),
      },
    ],
  };
}

export function getAutomationStatsResponse() {
  return {
    data: {
      summary: {
        total_rules: 3,
        total_runs: 44,
        total_errors: 1,
      },
    },
  };
}

export function getAutomationRunsResponse() {
  const runs = [];
  for (let i = 0; i < 10; i++) {
    runs.push({
      id: uuid(),
      definitionId: ["rule-mfa", "rule-offboard", "rule-access-review"][i % 3],
      status: i === 4 ? "failed" : "completed",
      started_at: hoursAgo(i * 6 + 1),
      completed_at: hoursAgo(i * 6),
    });
  }
  return { data: { items: runs } };
}
