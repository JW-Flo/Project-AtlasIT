/**
 * Compliance Drift Detector
 *
 * Detects when operational changes (adapter disconnected, health failure,
 * rule disabled, score regression) create compliance regression.
 * Emits DriftAlert objects for proactive notification.
 */

import { ACTION_COMPLIANCE_MAP } from "../automation/compliance-mapping";
import type { DriftAlert, DriftAlertType, DriftDetectionResult } from "./types";

export interface DriftEvent {
  type: string;
  source: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

/**
 * Detect compliance drift from recent operational events.
 *
 * Examines events that may cause compliance regression and maps them
 * to affected controls and frameworks.
 */
export async function detectComplianceDrift(
  db: any,
  tenantId: string,
  recentEvents: DriftEvent[],
): Promise<DriftDetectionResult> {
  const alerts: DriftAlert[] = [];

  for (const event of recentEvents) {
    switch (event.type) {
      case "app_disconnected":
        alerts.push(await handleAdapterDisconnected(db, tenantId, event));
        break;

      case "app_health_changed":
        if (event.metadata.healthy === false) {
          alerts.push(handleAdapterHealthFailure(event));
        }
        break;

      case "rule_disabled":
        alerts.push(handleRuleDisabled(event));
        break;

      case "compliance_score_changed": {
        const alert = handleScoreChange(event);
        if (alert) alerts.push(alert);
        break;
      }
    }
  }

  return {
    tenantId,
    alerts,
    detectedAt: new Date().toISOString(),
  };
}

async function handleAdapterDisconnected(
  db: any,
  tenantId: string,
  event: DriftEvent,
): Promise<DriftAlert> {
  const appId = (event.metadata.appId as string) ?? event.source;
  const appName = (event.metadata.appName as string) ?? appId;

  // Find controls that had evidence from this adapter
  const { results: affectedEvidence } = await db
    .prepare(
      `SELECT DISTINCT framework, control_id
       FROM compliance_evidence
       WHERE tenant_id = ? AND source LIKE ?`,
    )
    .bind(tenantId, `%${appId}%`)
    .all<{ framework: string; control_id: string }>();

  const affectedControls = (affectedEvidence ?? []).map((r) => `${r.framework}:${r.control_id}`);
  const affectedFrameworks = [...new Set((affectedEvidence ?? []).map((r) => r.framework))];

  return {
    id: crypto.randomUUID(),
    alertType: "adapter_disconnected",
    severity: "high",
    description: `${appName} adapter disconnected. Evidence collection will stop for ${affectedControls.length} control(s) across ${affectedFrameworks.length} framework(s)`,
    affectedControls,
    affectedFrameworks,
    suggestedRemediation: `Reconnect ${appName} from the Marketplace to resume evidence collection. Until reconnected, affected controls may become stale`,
    triggeredBy: `${event.type}:${appId}`,
    detectedAt: event.timestamp,
  };
}

function handleAdapterHealthFailure(event: DriftEvent): DriftAlert {
  const appId = (event.metadata.appId as string) ?? event.source;
  const appName = (event.metadata.appName as string) ?? appId;

  return {
    id: crypto.randomUUID(),
    alertType: "adapter_health_failure",
    severity: "medium",
    description: `${appName} adapter health check failed. Evidence collection may be degraded`,
    affectedControls: [],
    affectedFrameworks: [],
    suggestedRemediation: `Check ${appName} adapter configuration and credentials. Verify the service is accessible and API credentials haven't expired`,
    triggeredBy: `${event.type}:${appId}`,
    detectedAt: event.timestamp,
  };
}

function handleRuleDisabled(event: DriftEvent): DriftAlert {
  const ruleName = (event.metadata.ruleName as string) ?? "Unknown rule";
  const ruleId = (event.metadata.ruleId as string) ?? "unknown";
  const actionTypes = (event.metadata.actionTypes as string[]) ?? [];

  // Map disabled rule's actions to affected controls
  const affectedControls: string[] = [];
  const affectedFrameworks = new Set<string>();

  for (const actionType of actionTypes) {
    const controls = ACTION_COMPLIANCE_MAP[actionType] ?? [];
    for (const ctrl of controls) {
      const key = `${ctrl.framework}:${ctrl.controlId}`;
      if (!affectedControls.includes(key)) {
        affectedControls.push(key);
      }
      affectedFrameworks.add(ctrl.framework);
    }
  }

  return {
    id: crypto.randomUUID(),
    alertType: "rule_disabled",
    severity: affectedControls.length > 3 ? "high" : "medium",
    description: `Automation rule "${ruleName}" was disabled. ${affectedControls.length} compliance control(s) may lose evidence coverage`,
    affectedControls,
    affectedFrameworks: [...affectedFrameworks],
    suggestedRemediation: `Review whether "${ruleName}" should be re-enabled. If the rule was disabled intentionally, ensure alternative controls are in place`,
    triggeredBy: `rule_disabled:${ruleId}`,
    detectedAt: event.timestamp,
  };
}

function handleScoreChange(event: DriftEvent): DriftAlert | null {
  const direction = event.metadata.direction as string;
  if (direction !== "down") return null;

  const framework = (event.metadata.framework as string) ?? "unknown";
  const oldScore = (event.metadata.oldScore as number) ?? 0;
  const newScore = (event.metadata.newScore as number) ?? 0;
  const drop = oldScore - newScore;

  const severity = drop >= 20 ? "critical" : drop >= 10 ? "high" : "medium";

  return {
    id: crypto.randomUUID(),
    alertType: "score_regression",
    severity,
    description: `${framework} compliance score dropped from ${oldScore}% to ${newScore}% (${drop} point decrease)`,
    affectedControls: [],
    affectedFrameworks: [framework],
    suggestedRemediation: `Review the Compliance Intelligence gaps page for ${framework} to identify which controls lost evidence coverage. Run a manual evidence collection to refresh scores`,
    triggeredBy: `score_regression:${framework}`,
    detectedAt: event.timestamp,
  };
}
