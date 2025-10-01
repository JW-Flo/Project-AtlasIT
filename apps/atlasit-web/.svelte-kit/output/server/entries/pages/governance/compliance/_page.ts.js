import {
  l as listNotifications,
  a as listActivity,
  b as listOpenIncidents,
  g as getCoverage,
  c as getHealth,
} from "../../../../chunks/client.js";
const COVERAGE_FRAMEWORK = "SOC2";
const INCIDENT_LIMIT = 5;
const ACTIVITY_LIMIT = 8;
const NOTIFICATION_LIMIT = 8;
const LABELS = {
  health: "Health",
  coverage: "Coverage",
  incidents: "Incidents",
  activity: "Activity",
  notifications: "Notifications",
};
function isNormalizedError(error) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  );
}
function formatError(key, error) {
  const label = LABELS[key];
  if (isNormalizedError(error)) {
    const badge = [];
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
const load = async ({ fetch }) => {
  const fetchedAt = /* @__PURE__ */ new Date().toISOString();
  const tasks = {
    health: getHealth(fetch),
    coverage: getCoverage(COVERAGE_FRAMEWORK, fetch),
    incidents: listOpenIncidents(INCIDENT_LIMIT, fetch),
    activity: listActivity(ACTIVITY_LIMIT, fetch),
    notifications: listNotifications(NOTIFICATION_LIMIT, fetch),
  };
  const responses = {};
  const errors = [];
  await Promise.all(
    Object.keys(tasks).map(async (key) => {
      try {
        responses[key] = await tasks[key];
      } catch (error) {
        errors.push(formatError(key, error));
      }
    }),
  );
  const successCount = Object.keys(responses).length;
  const notificationsResp = responses.notifications;
  const data = {
    fetchedAt,
    health: responses.health ?? null,
    coverage: responses.coverage ?? null,
    incidents: responses.incidents ?? [],
    activity: responses.activity ?? [],
    notifications: notificationsResp?.items ?? [],
    notificationsUnreadCount: notificationsResp?.unreadCount,
    allFailed: successCount === 0,
  };
  if (errors.length) {
    data.partialError = errors.join("; ");
  }
  return data;
};
export { load };
//# sourceMappingURL=_page.ts.js.map
