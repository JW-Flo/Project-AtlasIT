import { daysAgo, hoursAgo, uuid } from "./helpers.js";

export function getAutomationRulesResponse() {
  return {
    data: [
      {
        id: uuid(),
        name: "Enforce MFA on New Users",
        description: "Automatically enforce MFA requirement when new user accounts are created",
        trigger_type: "user.created",
        enabled: true,
        run_count: 34,
        error_count: 0,
        last_run_at: daysAgo(3),
        last_status: "success",
        created_at: daysAgo(180),
      },
      {
        id: uuid(),
        name: "Auto-Revoke on Offboarding",
        description: "Revoke all access and permissions when user is deactivated",
        trigger_type: "user.deactivated",
        enabled: true,
        run_count: 8,
        error_count: 1,
        last_run_at: daysAgo(12),
        last_status: "success",
        created_at: daysAgo(180),
      },
      {
        id: uuid(),
        name: "Quarterly Access Review Trigger",
        description: "Automatically create access review campaigns on a quarterly schedule",
        trigger_type: "schedule.cron",
        enabled: true,
        run_count: 2,
        error_count: 0,
        last_run_at: daysAgo(90),
        last_status: "success",
        created_at: daysAgo(180),
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
  return {
    data: {
      items: [
        {
          id: uuid(),
          rule_id: "demo-000001",
          rule_name: "Enforce MFA on New Users",
          status: "success",
          started_at: daysAgo(3),
          completed_at: daysAgo(3),
          duration_ms: 1240,
        },
        {
          id: uuid(),
          rule_id: "demo-000001",
          rule_name: "Enforce MFA on New Users",
          status: "success",
          started_at: daysAgo(5),
          completed_at: daysAgo(5),
          duration_ms: 980,
        },
        {
          id: uuid(),
          rule_id: "demo-000002",
          rule_name: "Auto-Revoke on Offboarding",
          status: "success",
          started_at: daysAgo(12),
          completed_at: daysAgo(12),
          duration_ms: 2150,
        },
        {
          id: uuid(),
          rule_id: "demo-000002",
          rule_name: "Auto-Revoke on Offboarding",
          status: "error",
          started_at: daysAgo(45),
          completed_at: daysAgo(45),
          duration_ms: 850,
          error: "Timeout waiting for downstream service response",
        },
        {
          id: uuid(),
          rule_id: "demo-000003",
          rule_name: "Quarterly Access Review Trigger",
          status: "success",
          started_at: daysAgo(90),
          completed_at: daysAgo(90),
          duration_ms: 3420,
        },
      ],
    },
  };
}
