const DEFAULT_SLA_SECONDS = {
  critical: 3600,
  // 1 hour
  high: 14400,
  // 4 hours
  medium: 86400,
  // 24 hours
  low: 259200
  // 72 hours
};
function computeSlaBreachAt(createdAt, severity, config) {
  const key = severity;
  const seconds = config[key] ?? config.medium;
  const date = new Date(createdAt);
  date.setTime(date.getTime() + seconds * 1e3);
  return date.toISOString();
}
const VALID_TRANSITIONS = {
  open: ["investigating", "resolved"],
  investigating: ["resolved"],
  resolved: []
};
function validateStatusTransition(current, next) {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed)
    return false;
  return allowed.includes(next);
}

export { DEFAULT_SLA_SECONDS as D, computeSlaBreachAt as c, validateStatusTransition as v };
//# sourceMappingURL=lifecycle-BLhc1MUq.js.map
