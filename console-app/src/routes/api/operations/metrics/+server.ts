/**
 * GET /api/operations/metrics
 *
 * Returns aggregated operational metrics for the Operations dashboard:
 * - JML workflow success/failure rates and counts by type
 * - Provision/deprovision evidence counts by adapter
 * - Evidence pipeline health (per-adapter staleness, collection rates)
 * - Alerting thresholds (failure rate >50%, stale evidence >24h)
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface JmlMetrics {
  total: number;
  completed: number;
  failed: number;
  running: number;
  successRate: number;
  byType: Record<string, { total: number; completed: number; failed: number }>;
  avgDurationMs: number | null;
}

interface AdapterProvisionMetrics {
  adapter: string;
  provisions: number;
  deprovisions: number;
  failures: number;
  failureRate: number;
  lastActivity: string | null;
}

interface EvidenceHealthItem {
  adapter: string;
  totalItems: number;
  lastCollected: string | null;
  staleHours: number | null;
  isStale: boolean;
}

interface AlertItem {
  severity: "critical" | "warning" | "info";
  type: string;
  message: string;
  detail?: string;
}

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as { tenantId?: string } | undefined;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB ?? env.DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  try {
    const [jml, adapterProvisions, evidenceHealth, scoreSources] = await Promise.all([
      getJmlMetrics(db, tenantId),
      getAdapterProvisionMetrics(db, tenantId),
      getEvidenceHealth(db, tenantId),
      getScoreSources(db, tenantId),
    ]);

    const alerts = computeAlerts(jml, adapterProvisions, evidenceHealth, scoreSources);

    return json({
      jml,
      adapterProvisions,
      evidenceHealth,
      alerts,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return json({ error: "Failed to compute metrics" }, { status: 500 });
  }
};

async function getJmlMetrics(db: D1Database, tenantId: string): Promise<JmlMetrics> {
  const [summary, byType, avgDur] = await Promise.all([
    db
      .prepare(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
           SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running
         FROM workflow_runs WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .first<{ total: number; completed: number; failed: number; running: number }>(),
    db
      .prepare(
        `SELECT type,
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM workflow_runs WHERE tenant_id = ? GROUP BY type`,
      )
      .bind(tenantId)
      .all(),
    db
      .prepare(
        `SELECT AVG(duration_ms) as avg_dur FROM workflow_runs
         WHERE tenant_id = ? AND duration_ms IS NOT NULL AND status = 'completed'`,
      )
      .bind(tenantId)
      .first<{ avg_dur: number | null }>(),
  ]);

  const total = summary?.total ?? 0;
  const completed = summary?.completed ?? 0;
  const failed = summary?.failed ?? 0;
  const running = summary?.running ?? 0;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const typeMap: Record<string, { total: number; completed: number; failed: number }> = {};
  for (const r of byType.results ?? []) {
    const row = r as any;
    typeMap[row.type] = {
      total: row.total,
      completed: row.completed,
      failed: row.failed,
    };
  }

  return {
    total,
    completed,
    failed,
    running,
    successRate,
    byType: typeMap,
    avgDurationMs: avgDur?.avg_dur ? Math.round(avgDur.avg_dur) : null,
  };
}

async function getAdapterProvisionMetrics(
  db: D1Database,
  tenantId: string,
): Promise<AdapterProvisionMetrics[]> {
  const { results } = await db
    .prepare(
      `SELECT
         source as adapter,
         SUM(CASE WHEN event_type LIKE '%provision%' AND event_type NOT LIKE '%deprovision%' THEN 1 ELSE 0 END) as provisions,
         SUM(CASE WHEN event_type LIKE '%deprovision%' THEN 1 ELSE 0 END) as deprovisions,
         SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as failures,
         COUNT(*) as total,
         MAX(created_at) as last_activity
       FROM compliance_evidence
       WHERE tenant_id = ?
         AND (event_type LIKE '%provision%' OR event_type LIKE '%deprovision%')
       GROUP BY source`,
    )
    .bind(tenantId)
    .all();

  return (results ?? []).map((r: any) => ({
    adapter: r.adapter || "unknown",
    provisions: r.provisions ?? 0,
    deprovisions: r.deprovisions ?? 0,
    failures: r.failures ?? 0,
    failureRate: r.total > 0 ? Math.round((r.failures / r.total) * 100) : 0,
    lastActivity: r.last_activity,
  }));
}

async function getEvidenceHealth(db: D1Database, tenantId: string): Promise<EvidenceHealthItem[]> {
  const { results } = await db
    .prepare(
      `SELECT
         source as adapter,
         COUNT(*) as total_items,
         MAX(created_at) as last_collected
       FROM compliance_evidence
       WHERE tenant_id = ?
       GROUP BY source`,
    )
    .bind(tenantId)
    .all();

  const now = Date.now();
  return (results ?? []).map((r: any) => {
    const lastMs = r.last_collected ? new Date(r.last_collected).getTime() : null;
    const staleHours = lastMs ? Math.round((now - lastMs) / 3600000) : null;
    return {
      adapter: r.adapter || "unknown",
      totalItems: r.total_items ?? 0,
      lastCollected: r.last_collected,
      staleHours,
      isStale: staleHours !== null && staleHours > 24,
    };
  });
}

async function getScoreSources(db: D1Database, tenantId: string): Promise<Record<string, string>> {
  // Check KV_CACHE for score source metadata if available, otherwise just return empty
  // This is best-effort — the compliance scores API writes source info
  try {
    const { results } = await db
      .prepare(
        `SELECT framework, source FROM compliance_scores
         WHERE tenant_id = ? ORDER BY computed_at DESC LIMIT 10`,
      )
      .bind(tenantId)
      .all();
    const map: Record<string, string> = {};
    for (const r of results ?? []) {
      const row = r as any;
      if (!map[row.framework]) map[row.framework] = row.source ?? "unknown";
    }
    return map;
  } catch {
    return {};
  }
}

function computeAlerts(
  jml: JmlMetrics,
  adapterProvisions: AdapterProvisionMetrics[],
  evidenceHealth: EvidenceHealthItem[],
  scoreSources: Record<string, string>,
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Adapter failure rate > 50%
  for (const ap of adapterProvisions) {
    if (ap.failureRate > 50 && ap.provisions + ap.deprovisions >= 3) {
      alerts.push({
        severity: "critical",
        type: "adapter_failure_rate",
        message: `${ap.adapter} provisioning failure rate is ${ap.failureRate}%`,
        detail: `${ap.failures} failures out of ${ap.provisions + ap.deprovisions + ap.failures} operations`,
      });
    }
  }

  // Evidence stale > 24h
  for (const eh of evidenceHealth) {
    if (eh.isStale) {
      alerts.push({
        severity: "warning",
        type: "evidence_stale",
        message: `${eh.adapter} evidence is ${eh.staleHours}h old`,
        detail: `Last collected: ${eh.lastCollected}`,
      });
    }
  }

  // Self-assessed fallback
  for (const [framework, source] of Object.entries(scoreSources)) {
    if (source === "self-assessed-fallback" || source === "self-assessed") {
      alerts.push({
        severity: "warning",
        type: "score_fallback",
        message: `${framework} score uses ${source} data`,
        detail: "Evidence pipeline may not be producing data for this framework",
      });
    }
  }

  // JML failure rate > 50%
  if (jml.total >= 3 && jml.successRate < 50) {
    alerts.push({
      severity: "critical",
      type: "jml_failure_rate",
      message: `JML workflow success rate is only ${jml.successRate}%`,
      detail: `${jml.failed} failures out of ${jml.total} runs`,
    });
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}
