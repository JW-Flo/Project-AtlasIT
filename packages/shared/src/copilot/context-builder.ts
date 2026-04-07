/**
 * Copilot Context Builder
 *
 * Gathers tenant-specific data from D1 to inject into the AI system prompt.
 * Keeps context concise — summarizes rather than dumping raw data.
 */

import type { CopilotTenantContext } from "./types";

/**
 * Build copilot context from D1 for a given tenant.
 * Designed to work with both Cloudflare D1 and any DB with a similar prepare/bind/all interface.
 */
export async function buildCopilotContext(
  db: {
    prepare(sql: string): {
      bind(...args: unknown[]): {
        all<T>(): Promise<{ results: T[] }>;
        first<T>(): Promise<T | null>;
      };
    };
  },
  tenantId: string,
): Promise<CopilotTenantContext> {
  const [
    tenantRow,
    frameworksRow,
    scoresResult,
    appsResult,
    adapterHealthResult,
    insightsResult,
    remediationResult,
    evidenceResult,
    rulesResult,
    policiesResult,
    incidentsResult,
  ] = await Promise.all([
    // Tenant name
    db.prepare("SELECT name FROM tenants WHERE id = ?").bind(tenantId).first<{ name: string }>(),

    // Selected frameworks
    db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'selected_frameworks'",
      )
      .bind(tenantId)
      .first<{ value: string }>(),

    // Compliance scores (latest per framework)
    db
      .prepare(
        `SELECT framework, score FROM compliance_scores
       WHERE tenant_id = ? ORDER BY calculated_at DESC LIMIT 10`,
      )
      .bind(tenantId)
      .all<{ framework: string; score: number }>(),

    // Connected apps (integrations table)
    db
      .prepare(
        "SELECT provider AS app_id FROM integrations WHERE tenant_id = ? AND status = 'active'",
      )
      .bind(tenantId)
      .all<{ app_id: string }>(),

    // Adapter health (table may not exist in all environments)
    db
      .prepare(
        `SELECT adapter_slug, collected_at, items_count, error
       FROM adapter_collection_health WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .all<{
        adapter_slug: string;
        collected_at: string;
        items_count: number;
        error: string | null;
      }>()
      .catch(() => ({
        results: [] as {
          adapter_slug: string;
          collected_at: string;
          items_count: number;
          error: string | null;
        }[],
      })),

    // Recent compliance insights (last 7 days)
    db
      .prepare(
        `SELECT insight_type, severity, category, data, created_at
       FROM compliance_insights
       WHERE tenant_id = ? AND created_at > datetime('now', '-7 days')
       ORDER BY created_at DESC LIMIT 20`,
      )
      .bind(tenantId)
      .all<{
        insight_type: string;
        severity: string;
        category: string | null;
        data: string;
        created_at: string;
      }>()
      .catch(() => ({
        results: [] as {
          insight_type: string;
          severity: string;
          category: string | null;
          data: string;
          created_at: string;
        }[],
      })),

    // Remediation stats — table may not exist yet, handled in catch below
    db
      .prepare(
        `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as open_count,
         SUM(CASE WHEN due_date < datetime('now') AND status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as overdue
       FROM remediation_plans WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .first<{ total: number; open_count: number; overdue: number }>()
      .catch(() => null),

    // Evidence stats
    db
      .prepare(
        `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN created_at < datetime('now', '-30 days') THEN 1 ELSE 0 END) as stale,
         SUM(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as recent
       FROM compliance_evidence WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .first<{ total: number; stale: number; recent: number }>(),

    // Automation rule count
    db
      .prepare("SELECT COUNT(*) as cnt FROM automation_rules WHERE tenant_id = ? AND enabled = 1")
      .bind(tenantId)
      .first<{ cnt: number }>(),

    // Policy count (table may not exist)
    db
      .prepare("SELECT COUNT(*) as cnt FROM policies WHERE tenant_id = ?")
      .bind(tenantId)
      .first<{ cnt: number }>()
      .catch(() => null),

    // Open incidents (table may not exist)
    db
      .prepare(
        "SELECT COUNT(*) as cnt FROM incidents WHERE tenant_id = ? AND status IN ('open', 'investigating')",
      )
      .bind(tenantId)
      .first<{ cnt: number }>()
      .catch(() => null),
  ]);

  let frameworks: string[] = [];
  if (frameworksRow?.value) {
    try {
      frameworks = JSON.parse(frameworksRow.value);
    } catch {
      /* ignore */
    }
  }

  const scores: Record<string, number> = {};
  const seenFrameworks = new Set<string>();
  for (const row of scoresResult.results ?? []) {
    if (!seenFrameworks.has(row.framework)) {
      scores[row.framework] = row.score;
      seenFrameworks.add(row.framework);
    }
  }

  return {
    tenantId,
    tenantName: tenantRow?.name ?? "Unknown",
    selectedFrameworks: frameworks,
    complianceScores: scores,
    connectedApps: (appsResult.results ?? []).map((r) => r.app_id),
    adapterHealth: (adapterHealthResult.results ?? []).map((r) => ({
      slug: r.adapter_slug,
      lastCollected: r.collected_at,
      itemCount: r.items_count,
      error: r.error,
    })),
    recentInsights: (insightsResult.results ?? []).map((r) => ({
      type: r.insight_type,
      severity: r.severity,
      category: r.category,
      data: r.data,
      createdAt: r.created_at,
    })),
    remediationStats: {
      total: remediationResult?.total ?? 0,
      open: remediationResult?.open_count ?? 0,
      overdue: remediationResult?.overdue ?? 0,
    },
    evidenceStats: {
      totalItems: evidenceResult?.total ?? 0,
      staleCount: evidenceResult?.stale ?? 0,
      recentCount: evidenceResult?.recent ?? 0,
    },
    automationRuleCount: rulesResult?.cnt ?? 0,
    policyCount: policiesResult?.cnt ?? 0,
    openIncidents: incidentsResult?.cnt ?? 0,
  };
}

/**
 * Format copilot context into a concise system prompt section.
 */
export function formatContextForPrompt(ctx: CopilotTenantContext): string {
  const lines: string[] = [
    `## Tenant: ${ctx.tenantName}`,
    ``,
    `### Compliance Frameworks`,
    ctx.selectedFrameworks.length > 0
      ? ctx.selectedFrameworks
          .map((f) => {
            const score = ctx.complianceScores[f];
            return `- ${f}: ${score !== undefined ? `${score}%` : "not yet scored"}`;
          })
          .join("\n")
      : "- No frameworks selected",
    ``,
    `### Connected Apps (${ctx.connectedApps.length})`,
    ctx.connectedApps.length > 0 ? ctx.connectedApps.slice(0, 15).join(", ") : "None connected yet",
    ``,
    `### Evidence Pipeline`,
    `- Total evidence items: ${ctx.evidenceStats.totalItems}`,
    `- Collected in last 24h: ${ctx.evidenceStats.recentCount}`,
    `- Stale (>30 days): ${ctx.evidenceStats.staleCount}`,
    ``,
    `### Remediation`,
    `- Total plans: ${ctx.remediationStats.total}`,
    `- Open: ${ctx.remediationStats.open}`,
    `- Overdue: ${ctx.remediationStats.overdue}`,
    ``,
    `### Other`,
    `- Active automation rules: ${ctx.automationRuleCount}`,
    `- Policies: ${ctx.policyCount}`,
    `- Open incidents: ${ctx.openIncidents}`,
  ];

  // Adapter health issues
  const unhealthyAdapters = ctx.adapterHealth.filter((a) => a.error);
  if (unhealthyAdapters.length > 0) {
    lines.push(``);
    lines.push(`### Adapter Issues`);
    for (const a of unhealthyAdapters.slice(0, 5)) {
      lines.push(`- ${a.slug}: ${a.error}`);
    }
  }

  // Recent insights summary
  if (ctx.recentInsights.length > 0) {
    lines.push(``);
    lines.push(`### Recent Insights (last 7 days)`);
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>;
    for (const i of ctx.recentInsights) {
      bySeverity[i.severity] = (bySeverity[i.severity] ?? 0) + 1;
    }
    lines.push(
      `- ${ctx.recentInsights.length} total: ${Object.entries(bySeverity)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ")}`,
    );
  }

  return lines.join("\n");
}
