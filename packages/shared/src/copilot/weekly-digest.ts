/**
 * Weekly Compliance Digest Builder
 *
 * Gathers 7-day trends from D1 (score history, evidence changes, adapter health,
 * remediations) and generates an AI-powered weekly summary via Bedrock/Groq.
 */

import type {
  CopilotTenantContext,
  WeeklyDigest,
  WeeklyScoreChange,
  WeeklyEvidenceSummary,
  DigestDriftAlert,
  UpcomingDeadline,
} from "./types";
import type { AIMessage, AIOptions } from "../ai";

type D1DB = {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      first<T>(): Promise<T | null>;
    };
  };
};

export interface WeeklyDigestContext {
  tenantId: string;
  tenantName: string;
  scoreChanges: WeeklyScoreChange[];
  evidenceSummary: WeeklyEvidenceSummary;
  driftAlerts: DigestDriftAlert[];
  upcomingDeadlines: UpcomingDeadline[];
  /** Full copilot context for AI prompt enrichment */
  copilotContext: CopilotTenantContext;
}

/**
 * Gather weekly digest data from D1 for a tenant.
 * Covers: score history (7d), evidence counts, adapter health drift,
 * upcoming remediation deadlines, and policy review dates.
 */
export async function buildWeeklyDigestContext(
  db: D1DB,
  tenantId: string,
  copilotContext: CopilotTenantContext,
): Promise<WeeklyDigestContext> {
  const [
    scoreHistory,
    currentScores,
    evidenceNew,
    evidenceExpired,
    evidenceSources,
    upcomingRemediations,
    upcomingPolicies,
  ] = await Promise.all([
    // Score history from 7 days ago
    db
      .prepare(
        `SELECT framework, score, grade, recorded_at
         FROM compliance_history
         WHERE tenant_id = ? AND recorded_at >= datetime('now', '-7 days')
         ORDER BY recorded_at ASC`,
      )
      .bind(tenantId)
      .all<{ framework: string; score: number; grade: string; recorded_at: string }>(),

    // Current scores
    db
      .prepare(`SELECT framework, score, grade FROM compliance_scores WHERE tenant_id = ?`)
      .bind(tenantId)
      .all<{ framework: string; score: number; grade: string }>(),

    // New evidence this week
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM compliance_evidence
         WHERE tenant_id = ? AND created_at >= datetime('now', '-7 days')`,
      )
      .bind(tenantId)
      .first<{ cnt: number }>(),

    // Stale evidence (>30 days, no update in past week)
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM compliance_evidence
         WHERE tenant_id = ? AND created_at < datetime('now', '-30 days')`,
      )
      .bind(tenantId)
      .first<{ cnt: number }>(),

    // Evidence by source this week
    db
      .prepare(
        `SELECT source, COUNT(*) as cnt FROM compliance_evidence
         WHERE tenant_id = ? AND created_at >= datetime('now', '-7 days')
         GROUP BY source ORDER BY cnt DESC LIMIT 5`,
      )
      .bind(tenantId)
      .all<{ source: string; cnt: number }>(),

    // Upcoming remediations (due within 14 days)
    db
      .prepare(
        `SELECT id, title, due_date FROM remediation_plans
         WHERE tenant_id = ? AND status IN ('open', 'in_progress')
         AND due_date IS NOT NULL AND due_date <= datetime('now', '+14 days')
         ORDER BY due_date ASC LIMIT 10`,
      )
      .bind(tenantId)
      .all<{ id: string; title: string; due_date: string }>(),

    // Upcoming policy reviews (due within 14 days)
    db
      .prepare(
        `SELECT id, title, review_due_date FROM policies
         WHERE tenant_id = ? AND review_due_date IS NOT NULL
         AND review_due_date <= datetime('now', '+14 days')
         ORDER BY review_due_date ASC LIMIT 10`,
      )
      .bind(tenantId)
      .all<{ id: string; title: string; review_due_date: string }>(),
  ]);

  // Compute score changes by framework
  const scoreChanges: WeeklyScoreChange[] = [];
  const currentScoresMap = new Map((currentScores.results ?? []).map((s) => [s.framework, s]));

  for (const [framework, current] of currentScoresMap) {
    // Find earliest score in history for this framework
    const historyEntries = (scoreHistory.results ?? []).filter((h) => h.framework === framework);
    const previousScore = historyEntries.length > 0 ? historyEntries[0].score : current.score;

    scoreChanges.push({
      framework,
      previousScore,
      currentScore: current.score,
      delta: +(current.score - previousScore).toFixed(1),
      grade: current.grade,
    });
  }

  // Build evidence summary
  const evidenceSummary: WeeklyEvidenceSummary = {
    newItems: evidenceNew?.cnt ?? 0,
    expiredItems: evidenceExpired?.cnt ?? 0,
    totalItems: copilotContext.evidenceStats.totalItems,
    topSources: (evidenceSources.results ?? []).map((r) => ({
      source: r.source,
      count: r.cnt,
    })),
  };

  // Detect drift alerts from adapter health and score regressions
  const driftAlerts: DigestDriftAlert[] = [];

  // Adapters with errors = potential drift
  for (const adapter of copilotContext.adapterHealth) {
    if (adapter.error) {
      driftAlerts.push({
        controlId: "",
        framework: "",
        title: `Adapter "${adapter.slug}" failing`,
        detail: `Last error: ${adapter.error}. Last successful collection: ${adapter.lastCollected ?? "never"}.`,
        severity: "warning",
        recommendedAction: `Check the ${adapter.slug} adapter configuration and credentials.`,
      });
    }
  }

  // Score regressions > 5 points
  for (const sc of scoreChanges) {
    if (sc.delta <= -5) {
      driftAlerts.push({
        controlId: "",
        framework: sc.framework,
        title: `${sc.framework} score dropped ${Math.abs(sc.delta).toFixed(1)} points`,
        detail: `Score went from ${sc.previousScore}% to ${sc.currentScore}% over the past week.`,
        severity: sc.delta <= -10 ? "critical" : "warning",
        recommendedAction: `Review recent changes to ${sc.framework} controls and evidence collection.`,
      });
    }
  }

  // Build upcoming deadlines
  const now = Date.now();
  const upcomingDeadlines: UpcomingDeadline[] = [];

  for (const r of upcomingRemediations.results ?? []) {
    const daysRemaining = Math.ceil((new Date(r.due_date).getTime() - now) / 86400000);
    upcomingDeadlines.push({
      type: "remediation",
      label: r.title,
      dueDate: r.due_date,
      daysRemaining: Math.max(0, daysRemaining),
    });
  }

  for (const p of upcomingPolicies.results ?? []) {
    const daysRemaining = Math.ceil((new Date(p.review_due_date).getTime() - now) / 86400000);
    upcomingDeadlines.push({
      type: "policy_review",
      label: p.title,
      dueDate: p.review_due_date,
      daysRemaining: Math.max(0, daysRemaining),
    });
  }

  return {
    tenantId,
    tenantName: copilotContext.tenantName,
    scoreChanges,
    evidenceSummary,
    driftAlerts,
    upcomingDeadlines,
    copilotContext,
  };
}

/**
 * Format the weekly context into a prompt for AI generation.
 */
export function formatWeeklyDigestPrompt(ctx: WeeklyDigestContext): AIMessage[] {
  const scoreBlock = ctx.scoreChanges
    .map(
      (s) =>
        `- ${s.framework}: ${s.previousScore}% → ${s.currentScore}% (${s.delta >= 0 ? "+" : ""}${s.delta}) [Grade: ${s.grade}]`,
    )
    .join("\n");

  const evidenceBlock = [
    `- New evidence this week: ${ctx.evidenceSummary.newItems}`,
    `- Stale evidence (>30d): ${ctx.evidenceSummary.expiredItems}`,
    `- Total evidence: ${ctx.evidenceSummary.totalItems}`,
    ctx.evidenceSummary.topSources.length > 0
      ? `- Top sources: ${ctx.evidenceSummary.topSources.map((s) => `${s.source} (${s.count})`).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const driftBlock =
    ctx.driftAlerts.length > 0
      ? ctx.driftAlerts
          .map((d) => `- [${d.severity.toUpperCase()}] ${d.title}: ${d.detail}`)
          .join("\n")
      : "None detected";

  const deadlineBlock =
    ctx.upcomingDeadlines.length > 0
      ? ctx.upcomingDeadlines
          .map((d) => `- [${d.type}] ${d.label} — due in ${d.daysRemaining} day(s) (${d.dueDate})`)
          .join("\n")
      : "None in the next 14 days";

  const systemPrompt = `You are the AtlasIT Compliance Copilot generating a weekly digest for "${ctx.tenantName}".

Based on the tenant's 7-day data below, generate a JSON weekly digest with:
1. An executive summary (3-4 sentences) covering the week's compliance posture, trends, and key events
2. Up to 5 prioritized recommendations for the coming week

Data for the past week:

### Score Changes
${scoreBlock || "No scores available"}

### Evidence Pipeline
${evidenceBlock}

### Drift Alerts
${driftBlock}

### Upcoming Deadlines (next 14 days)
${deadlineBlock}

### Current State
- Connected apps: ${ctx.copilotContext.connectedApps.length}
- Active automation rules: ${ctx.copilotContext.automationRuleCount}
- Open incidents: ${ctx.copilotContext.openIncidents}
- Overdue remediations: ${ctx.copilotContext.remediationStats.overdue}

Output format (JSON only, no markdown fences):
{
  "executiveSummary": "...",
  "recommendations": ["...", "..."]
}`;

  return [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: "Generate this week's compliance digest." },
  ];
}

/**
 * Assemble the final WeeklyDigest from context + AI response.
 */
export function assembleWeeklyDigest(
  ctx: WeeklyDigestContext,
  aiResponse: { executiveSummary: string; recommendations: string[] },
): WeeklyDigest {
  const now = new Date();
  const weekEnd = now.toISOString();
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();

  return {
    tenantId: ctx.tenantId,
    generatedAt: now.toISOString(),
    weekStart,
    weekEnd,
    executiveSummary: aiResponse.executiveSummary,
    scoreChanges: ctx.scoreChanges,
    evidenceSummary: ctx.evidenceSummary,
    driftAlerts: ctx.driftAlerts,
    upcomingDeadlines: ctx.upcomingDeadlines,
    recommendations: aiResponse.recommendations,
  };
}
