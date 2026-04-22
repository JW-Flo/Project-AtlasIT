import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB ?? env.DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  try {
    const [jml, adapterProvisions, evidenceHealth, scoreSources] = await Promise.all([
      getJmlMetrics(db, tenantId),
      getAdapterProvisionMetrics(db, tenantId),
      getEvidenceHealth(db, tenantId),
      getScoreSources(db, tenantId)
    ]);
    const alerts = computeAlerts(jml, adapterProvisions, evidenceHealth, scoreSources);
    return json({
      jml,
      adapterProvisions,
      evidenceHealth,
      alerts,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    return json({ error: "Failed to compute metrics" }, { status: 500 });
  }
};
async function getJmlMetrics(db, tenantId) {
  const [summary, byType, avgDur] = await Promise.all([
    db.prepare(
      `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
           SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running
         FROM workflow_runs WHERE tenant_id = ?`
    ).bind(tenantId).first(),
    db.prepare(
      `SELECT type,
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM workflow_runs WHERE tenant_id = ? GROUP BY type`
    ).bind(tenantId).all(),
    db.prepare(
      `SELECT AVG(duration_ms) as avg_dur FROM workflow_runs
         WHERE tenant_id = ? AND duration_ms IS NOT NULL AND status = 'completed'`
    ).bind(tenantId).first()
  ]);
  const total = summary?.total ?? 0;
  const completed = summary?.completed ?? 0;
  const failed = summary?.failed ?? 0;
  const running = summary?.running ?? 0;
  const successRate = total > 0 ? Math.round(completed / total * 100) : 0;
  const typeMap = {};
  for (const r of byType.results ?? []) {
    const row = r;
    typeMap[row.type] = {
      total: row.total,
      completed: row.completed,
      failed: row.failed
    };
  }
  return {
    total,
    completed,
    failed,
    running,
    successRate,
    byType: typeMap,
    avgDurationMs: avgDur?.avg_dur ? Math.round(avgDur.avg_dur) : null
  };
}
async function getAdapterProvisionMetrics(db, tenantId) {
  const { results } = await db.prepare(
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
       GROUP BY source`
  ).bind(tenantId).all();
  return (results ?? []).map((r) => ({
    adapter: r.adapter || "unknown",
    provisions: r.provisions ?? 0,
    deprovisions: r.deprovisions ?? 0,
    failures: r.failures ?? 0,
    failureRate: r.total > 0 ? Math.round(r.failures / r.total * 100) : 0,
    lastActivity: r.last_activity
  }));
}
async function getEvidenceHealth(db, tenantId) {
  const { results } = await db.prepare(
    `SELECT
         source as adapter,
         COUNT(*) as total_items,
         MAX(created_at) as last_collected
       FROM compliance_evidence
       WHERE tenant_id = ?
       GROUP BY source`
  ).bind(tenantId).all();
  const now = Date.now();
  return (results ?? []).map((r) => {
    const lastMs = r.last_collected ? new Date(r.last_collected).getTime() : null;
    const staleHours = lastMs ? Math.round((now - lastMs) / 36e5) : null;
    return {
      adapter: r.adapter || "unknown",
      totalItems: r.total_items ?? 0,
      lastCollected: r.last_collected,
      staleHours,
      isStale: staleHours !== null && staleHours > 24
    };
  });
}
async function getScoreSources(db, tenantId) {
  try {
    const { results } = await db.prepare(
      `SELECT framework, source FROM compliance_scores
         WHERE tenant_id = ? ORDER BY computed_at DESC LIMIT 10`
    ).bind(tenantId).all();
    const map = {};
    for (const r of results ?? []) {
      const row = r;
      if (!map[row.framework]) map[row.framework] = row.source ?? "unknown";
    }
    return map;
  } catch {
    return {};
  }
}
function computeAlerts(jml, adapterProvisions, evidenceHealth, scoreSources) {
  const alerts = [];
  for (const ap of adapterProvisions) {
    if (ap.failureRate > 50 && ap.provisions + ap.deprovisions >= 3) {
      alerts.push({
        severity: "critical",
        type: "adapter_failure_rate",
        message: `${ap.adapter} provisioning failure rate is ${ap.failureRate}%`,
        detail: `${ap.failures} failures out of ${ap.provisions + ap.deprovisions + ap.failures} operations`
      });
    }
  }
  for (const eh of evidenceHealth) {
    if (eh.isStale) {
      alerts.push({
        severity: "warning",
        type: "evidence_stale",
        message: `${eh.adapter} evidence is ${eh.staleHours}h old`,
        detail: `Last collected: ${eh.lastCollected}`
      });
    }
  }
  for (const [framework, source] of Object.entries(scoreSources)) {
    if (source === "self-assessed-fallback" || source === "self-assessed") {
      alerts.push({
        severity: "warning",
        type: "score_fallback",
        message: `${framework} score uses ${source} data`,
        detail: "Evidence pipeline may not be producing data for this framework"
      });
    }
  }
  if (jml.total >= 3 && jml.successRate < 50) {
    alerts.push({
      severity: "critical",
      type: "jml_failure_rate",
      message: `JML workflow success rate is only ${jml.successRate}%`,
      detail: `${jml.failed} failures out of ${jml.total} runs`
    });
  }
  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export { GET };
//# sourceMappingURL=_server.ts-BaZxCH9T.js.map
