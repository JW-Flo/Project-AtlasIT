/**
 * Incident lifecycle helpers: SLA computation, status transitions.
 * Shared between console-app API routes and orchestrator cron duties.
 */

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "resolved";

export interface SlaConfig {
  critical: number; // seconds
  high: number;
  medium: number;
  low: number;
}

export const DEFAULT_SLA_SECONDS: SlaConfig = {
  critical: 3600, // 1 hour
  high: 14400, // 4 hours
  medium: 86400, // 24 hours
  low: 259200, // 72 hours
};

/**
 * Compute the SLA breach timestamp for an incident.
 * Returns ISO 8601 string.
 */
export function computeSlaBreachAt(createdAt: string, severity: string, config: SlaConfig): string {
  const key = severity as IncidentSeverity;
  const seconds = config[key] ?? config.medium;
  const date = new Date(createdAt);
  date.setTime(date.getTime() + seconds * 1000);
  return date.toISOString();
}

/**
 * Valid status transitions for the incident lifecycle.
 * Forward-only: open -> investigating -> resolved, or open -> resolved (skip investigating).
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ["investigating", "resolved"],
  investigating: ["resolved"],
  resolved: [],
};

export function validateStatusTransition(current: string, next: string): boolean {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.includes(next);
}
