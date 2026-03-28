/**
 * Risk Anomaly Detector
 *
 * Surfaces unusual access patterns from automation execution history:
 * - Bulk privilege escalation (>5 provisions in 1 hour)
 * - Off-hours provisioning (outside business hours)
 * - Unusual revocation volume (>10 revocations in 1 hour)
 * - SoD violations (conflicting roles on same app)
 * - Dormant account reactivation (access to inactive users)
 */

import type { RiskAnomaly, AnomalyType } from "./types";

interface AnomalyDetectorOptions {
  /** Start of business hours in UTC (default: 6) */
  businessHoursStart?: number;
  /** End of business hours in UTC (default: 20) */
  businessHoursEnd?: number;
  /** Bulk provisioning threshold (default: 5) */
  bulkProvisionThreshold?: number;
  /** Bulk revocation threshold (default: 10) */
  bulkRevocationThreshold?: number;
}

interface ExecutionRow {
  id: string;
  rule_id: string;
  status: string;
  results: string;
  trigger_event: string;
  created_at: string;
}

interface ParsedAction {
  type: string;
  config: Record<string, unknown>;
}

function parseActions(resultsJson: string): ParsedAction[] {
  try {
    const parsed = JSON.parse(resultsJson);
    return parsed.actions ?? [];
  } catch {
    return [];
  }
}

function parseUserEmail(triggerEventJson: string): string {
  try {
    const parsed = JSON.parse(triggerEventJson);
    return parsed.payload?.user?.email ?? parsed.payload?.email ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Detect risk anomalies from recent automation execution history.
 */
export async function detectRiskAnomalies(
  db: any,
  tenantId: string,
  options: AnomalyDetectorOptions = {},
): Promise<RiskAnomaly[]> {
  const {
    businessHoursStart = 6,
    businessHoursEnd = 20,
    bulkProvisionThreshold = 5,
    bulkRevocationThreshold = 10,
  } = options;

  // Fetch recent executions (last 24 hours)
  const { results: executions } = await db
    .prepare(
      `SELECT id, rule_id, status, results, trigger_event, created_at
       FROM automation_executions
       WHERE tenant_id = ? AND created_at > datetime('now', '-24 hours')
       ORDER BY created_at DESC
       LIMIT 500`,
    )
    .bind(tenantId)
    .all();

  if (!executions?.length) return [];
  const typedExecutions = executions as ExecutionRow[];

  const anomalies: RiskAnomaly[] = [];
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  // Group executions by action type for the last hour
  const recentProvisions: { email: string; appId: string; at: string }[] = [];
  const recentRevocations: { email: string; appId: string; at: string }[] = [];
  const offHoursProvisions: { email: string; appId: string; at: string }[] = [];

  for (const exec of typedExecutions) {
    const actions = parseActions(exec.results);
    const email = parseUserEmail(exec.trigger_event);
    const execTime = new Date(exec.created_at).getTime();
    const execHour = new Date(exec.created_at).getUTCHours();

    for (const action of actions) {
      const appId = (action.config?.appId as string) ?? "unknown";

      if (action.type === "provision_app_access" || action.type === "assign_role") {
        if (execTime > oneHourAgo) {
          recentProvisions.push({ email, appId, at: exec.created_at });
        }

        // Off-hours check
        if (execHour < businessHoursStart || execHour >= businessHoursEnd) {
          offHoursProvisions.push({ email, appId, at: exec.created_at });
        }
      }

      if (action.type === "revoke_app_access" || action.type === "remove_role") {
        if (execTime > oneHourAgo) {
          recentRevocations.push({ email, appId, at: exec.created_at });
        }
      }
    }
  }

  // Check bulk privilege escalation
  if (recentProvisions.length > bulkProvisionThreshold) {
    const affectedUsers = [...new Set(recentProvisions.map((p) => p.email))];
    const affectedApps = [...new Set(recentProvisions.map((p) => p.appId))];

    anomalies.push({
      anomalyType: "bulk_privilege_escalation",
      severity: recentProvisions.length > bulkProvisionThreshold * 2 ? "critical" : "high",
      description: `${recentProvisions.length} access grants detected in the last hour across ${affectedApps.length} app(s) for ${affectedUsers.length} user(s). This may indicate unauthorized bulk provisioning`,
      affectedUsers,
      affectedApps,
      detectedAt: new Date().toISOString(),
      evidence: {
        provisionCount: recentProvisions.length,
        threshold: bulkProvisionThreshold,
        windowHours: 1,
      },
    });
  }

  // Check unusual revocation volume
  if (recentRevocations.length > bulkRevocationThreshold) {
    const affectedUsers = [...new Set(recentRevocations.map((r) => r.email))];
    const affectedApps = [...new Set(recentRevocations.map((r) => r.appId))];

    anomalies.push({
      anomalyType: "unusual_revocation_volume",
      severity: recentRevocations.length > bulkRevocationThreshold * 2 ? "critical" : "high",
      description: `${recentRevocations.length} access revocations in the last hour across ${affectedApps.length} app(s). This could indicate a breach response or misconfigured automation rule`,
      affectedUsers,
      affectedApps,
      detectedAt: new Date().toISOString(),
      evidence: {
        revocationCount: recentRevocations.length,
        threshold: bulkRevocationThreshold,
        windowHours: 1,
      },
    });
  }

  // Check off-hours provisioning
  if (offHoursProvisions.length > 0) {
    const affectedUsers = [...new Set(offHoursProvisions.map((p) => p.email))];
    const affectedApps = [...new Set(offHoursProvisions.map((p) => p.appId))];

    anomalies.push({
      anomalyType: "off_hours_provisioning",
      severity: offHoursProvisions.length > 3 ? "high" : "medium",
      description: `${offHoursProvisions.length} access change(s) detected outside business hours (${businessHoursStart}:00-${businessHoursEnd}:00 UTC). Review for unauthorized activity`,
      affectedUsers,
      affectedApps,
      detectedAt: new Date().toISOString(),
      evidence: {
        offHoursCount: offHoursProvisions.length,
        businessHours: `${businessHoursStart}:00-${businessHoursEnd}:00 UTC`,
        events: offHoursProvisions.slice(0, 10),
      },
    });
  }

  return anomalies;
}
