/**
 * Smart Alerts Detection Engine
 *
 * Goes beyond simple threshold-based alerts. Analyzes trends, patterns,
 * and cross-entity relationships to generate predictive alerts like:
 * "Your evidence collection stopped 2 days ago — this will affect your
 * SOC 2 CC7.5 score by next week."
 */

import type { CopilotTenantContext, SmartAlert, SmartAlertType } from "./types";

type D1DB = {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      first<T>(): Promise<T | null>;
    };
  };
};

interface AlertDetector {
  type: SmartAlertType;
  detect(db: D1DB, tenantId: string, ctx: CopilotTenantContext): Promise<SmartAlert[]>;
}

/**
 * Run all smart alert detectors for a tenant.
 * Returns alerts sorted by severity (critical first).
 */
export async function detectSmartAlerts(
  db: D1DB,
  tenantId: string,
  ctx: CopilotTenantContext,
): Promise<SmartAlert[]> {
  const allAlerts: SmartAlert[] = [];

  const settled = await Promise.allSettled(detectors.map((d) => d.detect(db, tenantId, ctx)));

  for (const result of settled) {
    if (result.status === "fulfilled") {
      allAlerts.push(...result.value);
    }
  }

  // Sort: critical → warning → info
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  allAlerts.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  return allAlerts;
}

// ── Detectors ────────────────────────────────────────────────────────────

const detectors: AlertDetector[] = [
  {
    type: "evidence_collection_stopped",
    async detect(db, tenantId, ctx): Promise<SmartAlert[]> {
      const alerts: SmartAlert[] = [];

      for (const adapter of ctx.adapterHealth) {
        if (!adapter.lastCollected) continue;

        const lastCollected = new Date(adapter.lastCollected);
        const hoursSince = (Date.now() - lastCollected.getTime()) / 3600000;

        // Alert if no collection for >24h (expected every 5 min cron)
        if (hoursSince > 24) {
          const daysSince = Math.floor(hoursSince / 24);

          // Find controls affected by this adapter
          const { results: affectedControls } = await db
            .prepare(
              `SELECT DISTINCT control_id FROM compliance_evidence
               WHERE tenant_id = ? AND source = 'adapter'
               AND metadata LIKE ?
               LIMIT 10`,
            )
            .bind(tenantId, `%${adapter.slug}%`)
            .all<{ control_id: string }>();

          const controlIds = (affectedControls ?? []).map((c) => c.control_id);
          const controlStr =
            controlIds.length > 0
              ? controlIds.slice(0, 3).join(", ") +
                (controlIds.length > 3 ? ` and ${controlIds.length - 3} more` : "")
              : "multiple controls";

          alerts.push({
            id: `ecs-${tenantId}-${adapter.slug}`,
            tenantId,
            type: "evidence_collection_stopped",
            severity: daysSince >= 3 ? "critical" : "warning",
            title: `Evidence collection from ${adapter.slug} stopped ${daysSince} day(s) ago`,
            detail: `The ${adapter.slug} adapter hasn't collected evidence since ${adapter.lastCollected}. ${adapter.error ? `Last error: ${adapter.error}` : "No error recorded."}`,
            impact: `This will affect scores for ${controlStr} if evidence becomes stale.`,
            recommendedAction: `Check ${adapter.slug} adapter credentials and connectivity. Re-run evidence collection manually if needed.`,
            affectedControls: controlIds,
            detectedAt: new Date().toISOString(),
            acknowledged: false,
          });
        }
      }

      return alerts;
    },
  },

  {
    type: "score_regression_trend",
    async detect(db, tenantId): Promise<SmartAlert[]> {
      const alerts: SmartAlert[] = [];

      // Look for consistent downward trend over 3+ data points in last 14 days
      const { results: history } = await db
        .prepare(
          `SELECT framework, score, recorded_at
           FROM compliance_history
           WHERE tenant_id = ? AND recorded_at >= datetime('now', '-14 days')
           ORDER BY framework, recorded_at ASC`,
        )
        .bind(tenantId)
        .all<{ framework: string; score: number; recorded_at: string }>();

      // Group by framework
      const byFramework = new Map<string, Array<{ score: number; date: string }>>();
      for (const row of history ?? []) {
        if (!byFramework.has(row.framework)) {
          byFramework.set(row.framework, []);
        }
        byFramework.get(row.framework)!.push({
          score: row.score,
          date: row.recorded_at,
        });
      }

      for (const [framework, entries] of byFramework) {
        if (entries.length < 3) continue;

        // Check if last 3 entries are consistently declining
        const recent = entries.slice(-3);
        const allDeclining = recent.every(
          (_, i) => i === 0 || recent[i].score < recent[i - 1].score,
        );

        if (allDeclining) {
          const totalDrop = recent[0].score - recent[recent.length - 1].score;
          if (totalDrop < 2) continue; // Ignore trivial changes

          // Project where score will be in 7 days at this rate
          const daysSpan =
            (new Date(recent[recent.length - 1].date).getTime() -
              new Date(recent[0].date).getTime()) /
            86400000;
          const dailyRate = totalDrop / Math.max(daysSpan, 1);
          const projectedDrop = +(dailyRate * 7).toFixed(1);
          const projectedScore = Math.max(
            0,
            +(recent[recent.length - 1].score - projectedDrop).toFixed(1),
          );

          alerts.push({
            id: `srt-${tenantId}-${framework}`,
            tenantId,
            type: "score_regression_trend",
            severity: totalDrop >= 10 ? "critical" : "warning",
            title: `${framework} score declining — down ${totalDrop.toFixed(1)} pts in ${Math.round(daysSpan)} days`,
            detail: `${framework} has dropped consistently from ${recent[0].score}% to ${recent[recent.length - 1].score}% over the last ${Math.round(daysSpan)} days.`,
            impact: `At this rate, your ${framework} score could reach ${projectedScore}% by next week.`,
            recommendedAction: `Review recent control changes and evidence gaps for ${framework}. Check if any adapters stopped collecting.`,
            affectedControls: [],
            detectedAt: new Date().toISOString(),
            acknowledged: false,
          });
        }
      }

      return alerts;
    },
  },

  {
    type: "adapter_health_degraded",
    async detect(_db, tenantId, ctx): Promise<SmartAlert[]> {
      const alerts: SmartAlert[] = [];
      const errorAdapters = ctx.adapterHealth.filter((a) => a.error);

      if (errorAdapters.length >= 2) {
        alerts.push({
          id: `ahd-${tenantId}-multi`,
          tenantId,
          type: "adapter_health_degraded",
          severity: errorAdapters.length >= 3 ? "critical" : "warning",
          title: `${errorAdapters.length} adapters are failing`,
          detail: `Failing adapters: ${errorAdapters.map((a) => a.slug).join(", ")}. This impacts evidence collection across multiple frameworks.`,
          impact: `With ${errorAdapters.length} adapters down, automated evidence collection is significantly reduced. Manual evidence may be needed.`,
          recommendedAction: `Check adapter configurations in Settings → Integrations. Common causes: expired OAuth tokens, rate limiting, or API changes.`,
          affectedControls: [],
          detectedAt: new Date().toISOString(),
          acknowledged: false,
        });
      }

      return alerts;
    },
  },

  {
    type: "remediation_overdue_escalation",
    async detect(db, tenantId, ctx): Promise<SmartAlert[]> {
      const alerts: SmartAlert[] = [];

      if (ctx.remediationStats.overdue === 0) return alerts;

      // Find the most overdue items
      const { results: overdue } = await db
        .prepare(
          `SELECT id, title, due_date, framework FROM remediation_plans
           WHERE tenant_id = ? AND status IN ('open', 'in_progress')
           AND due_date < datetime('now')
           ORDER BY due_date ASC LIMIT 5`,
        )
        .bind(tenantId)
        .all<{ id: string; title: string; due_date: string; framework: string }>();

      const overdueItems = overdue ?? [];
      if (overdueItems.length === 0) return alerts;

      const mostOverdueDays = Math.ceil(
        (Date.now() - new Date(overdueItems[0].due_date).getTime()) / 86400000,
      );

      alerts.push({
        id: `roe-${tenantId}`,
        tenantId,
        type: "remediation_overdue_escalation",
        severity: mostOverdueDays >= 14 ? "critical" : "warning",
        title: `${ctx.remediationStats.overdue} remediation(s) overdue — oldest by ${mostOverdueDays} day(s)`,
        detail: `Overdue items: ${overdueItems.map((r) => `"${r.title}" (${r.framework}, ${Math.ceil((Date.now() - new Date(r.due_date).getTime()) / 86400000)}d overdue)`).join("; ")}`,
        impact: `Overdue remediations prevent controls from reaching "verified" status and may be flagged in audits.`,
        recommendedAction: `Prioritize the oldest overdue items. Consider reassigning if current owners are unavailable.`,
        affectedControls: [],
        detectedAt: new Date().toISOString(),
        acknowledged: false,
      });

      return alerts;
    },
  },

  {
    type: "evidence_gap_detected",
    async detect(db, tenantId, ctx): Promise<SmartAlert[]> {
      const alerts: SmartAlert[] = [];

      // Find frameworks with selected controls but zero evidence in last 30 days
      for (const framework of ctx.selectedFrameworks) {
        const evidenceRow = await db
          .prepare(
            `SELECT COUNT(*) as cnt FROM compliance_evidence
             WHERE tenant_id = ? AND framework = ?
             AND created_at >= datetime('now', '-30 days')`,
          )
          .bind(tenantId, framework)
          .first<{ cnt: number }>();

        if ((evidenceRow?.cnt ?? 0) === 0 && ctx.connectedApps.length > 0) {
          alerts.push({
            id: `egd-${tenantId}-${framework}`,
            tenantId,
            type: "evidence_gap_detected",
            severity: "warning",
            title: `No evidence collected for ${framework} in 30 days`,
            detail: `Despite having ${ctx.connectedApps.length} connected app(s), no evidence has been collected for ${framework} controls in the past 30 days.`,
            impact: `${framework} scores will stagnate or drop. Auditors expect continuous evidence collection.`,
            recommendedAction: `Check that your connected apps map to ${framework} controls. Run manual evidence collection or connect additional adapters.`,
            affectedControls: [],
            detectedAt: new Date().toISOString(),
            acknowledged: false,
          });
        }
      }

      return alerts;
    },
  },

  {
    type: "compliance_drift",
    async detect(db, tenantId, ctx): Promise<SmartAlert[]> {
      const alerts: SmartAlert[] = [];

      // Detect if overall posture is strong but a specific area is weak
      const scores = Object.values(ctx.complianceScores);
      if (scores.length < 2) return alerts;

      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

      for (const [framework, score] of Object.entries(ctx.complianceScores)) {
        const gap = avg - score;
        if (gap >= 15 && score < 60) {
          alerts.push({
            id: `cd-${tenantId}-${framework}`,
            tenantId,
            type: "compliance_drift",
            severity: gap >= 25 ? "critical" : "warning",
            title: `${framework} is ${gap.toFixed(0)} points below your average`,
            detail: `Your average compliance score is ${avg.toFixed(0)}% but ${framework} is at ${score}%. This framework is significantly lagging behind.`,
            impact: `A weak ${framework} score creates audit risk and may block certifications that require all frameworks at minimum thresholds.`,
            recommendedAction: `Focus remediation efforts on ${framework}. Use the "What should I do next?" copilot action filtered to ${framework}.`,
            affectedControls: [],
            detectedAt: new Date().toISOString(),
            acknowledged: false,
          });
        }
      }

      return alerts;
    },
  },
];
