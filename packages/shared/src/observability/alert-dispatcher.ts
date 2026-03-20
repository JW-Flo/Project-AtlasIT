/**
 * Alert Dispatcher — sends SLO violation alerts via webhook.
 *
 * Designed for Cloudflare Workers (uses fetch, no Node.js deps).
 * Includes per-SLO deduplication to avoid alert spam.
 */

import type { SLOCheckResult, SLOAlert } from "./slo-monitor.js";

export interface AlertConfig {
  webhookUrl: string;
  channel?: string;
  /** Minimum ms between alerts for the same SLO. Defaults to 5 minutes. */
  minAlertIntervalMs?: number;
}

const DEFAULT_DEDUP_MS = 5 * 60 * 1000; // 5 minutes

export class AlertDispatcher {
  private readonly config: AlertConfig;
  private readonly lastAlertAt = new Map<string, number>();

  constructor(config: AlertConfig) {
    this.config = config;
  }

  /**
   * Dispatch an alert for an SLO check result.
   * Returns true if the alert was sent, false if suppressed or failed.
   */
  async dispatch(result: SLOCheckResult): Promise<boolean> {
    if (result.alerts.length === 0) return false;

    // Dedup check
    const dedupMs = this.config.minAlertIntervalMs ?? DEFAULT_DEDUP_MS;
    const lastSent = this.lastAlertAt.get(result.sloName);
    if (lastSent !== undefined && Date.now() - lastSent < dedupMs) {
      return false;
    }

    // Pick the highest severity alert (critical > warning)
    const topAlert = pickHighestSeverity(result.alerts);

    const payload: Record<string, unknown> = {
      sloName: result.sloName,
      severity: topAlert.severity,
      burnRate: topAlert.burnRate,
      actualBurnRate: topAlert.actualBurnRate,
      budgetRemaining: result.budgetRemaining,
      message: topAlert.message,
      ts: new Date().toISOString(),
    };

    if (this.config.channel) {
      payload.channel = this.config.channel;
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) return false;

      this.lastAlertAt.set(result.sloName, Date.now());
      return true;
    } catch {
      return false;
    }
  }
}

function pickHighestSeverity(alerts: SLOAlert[]): SLOAlert {
  const critical = alerts.find((a) => a.severity === "critical");
  return critical ?? alerts[0];
}
