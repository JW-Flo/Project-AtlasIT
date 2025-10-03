import type { PageLoad } from "./$types";
import {
  getHealth,
  getCoverage,
  listOpenIncidents,
  listActivity,
  listNotifications,
  type NormalizedApiError,
} from "$lib/api/client";
import type {
  ComplianceDashboardData,
  NotificationsListResponse,
} from "$lib/api/types";

const COVERAGE_FRAMEWORK = "SOC2";
const INCIDENT_LIMIT = 5;
const ACTIVITY_LIMIT = 8;
const NOTIFICATION_LIMIT = 8;

type TaskMap = {
  health: ReturnType<typeof getHealth>;
  coverage: ReturnType<typeof getCoverage>;
  incidents: ReturnType<typeof listOpenIncidents>;
  activity: ReturnType<typeof listActivity>;
  notifications: ReturnType<typeof listNotifications>;
};

type TaskKey = keyof TaskMap;

const LABELS: Record<TaskKey, string> = {
  health: "Health",
  coverage: "Coverage",
  incidents: "Incidents",
  activity: "Activity",
  notifications: "Notifications",
};

function isNormalizedError(error: unknown): error is NormalizedApiError {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  );
}

function formatError(key: TaskKey, error: unknown): string {
  const label = LABELS[key];
  if (isNormalizedError(error)) {
    const badge: string[] = [];
    if (error.code) badge.push(error.code);
    if (error.requestId) badge.push(`req:${error.requestId}`);
    const suffix = badge.length ? ` [${badge.join(" ")}]` : "";
    return `${label}: ${error.message}${suffix}`;
  }
  if (error instanceof Error) {
    return `${label}: ${error.message}`;
  }
  return `${label}: Failed to load`;
}

export const load: PageLoad = async ({ fetch }) => {
  const fetchedAt = new Date().toISOString();

  const tasks = {
    health: getHealth(fetch),
    coverage: getCoverage(COVERAGE_FRAMEWORK, fetch),
    incidents: listOpenIncidents(INCIDENT_LIMIT, fetch),
    activity: listActivity(ACTIVITY_LIMIT, fetch),
    notifications: listNotifications(NOTIFICATION_LIMIT, fetch),
  } satisfies TaskMap;

  const responses: Partial<{ [K in TaskKey]: Awaited<TaskMap[K]> }> = {};
  const errors: string[] = [];

  await Promise.all(
    (Object.keys(tasks) as TaskKey[]).map(async (key) => {
      try {
        responses[key] = await tasks[key];
      } catch (error) {
        errors.push(formatError(key, error));
      }
    }),
  );

  const successCount = Object.keys(responses).length;

  const notificationsResp = responses.notifications as
    | NotificationsListResponse
    | undefined;

  const data: ComplianceDashboardData = {
    fetchedAt,
    health: (responses.health as Awaited<TaskMap["health"]>) ?? null,
    coverage: (responses.coverage as Awaited<TaskMap["coverage"]>) ?? null,
    incidents: (responses.incidents as Awaited<TaskMap["incidents"]>) ?? [],
    activity: (responses.activity as Awaited<TaskMap["activity"]>) ?? [],
    notifications: notificationsResp?.items ?? [],
    notificationsUnreadCount: notificationsResp?.unreadCount,
    allFailed: successCount === 0,
  };

  if (errors.length) {
    data.partialError = errors.join("; ");
  }

  return data;
};
