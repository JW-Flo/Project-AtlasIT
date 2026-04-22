import { json } from '@sveltejs/kit';
import { t as toCamel } from './dto-qzAL3BiV.js';

function escapeCSV(value) {
  if (value == null) return "";
  const str = String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe.includes("\r")) {
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  return safe;
}
function buildCSV(headers, rows) {
  const lines = [headers.map(escapeCSV).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(","));
  }
  return lines.join("\n");
}
function csvResponse(csv, filename) {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
const GET = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const widget = url.searchParams.get("widget");
  if (!widget) return json({ error: "widget parameter required" }, { status: 400 });
  const days = Math.min(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 365);
  const framework = url.searchParams.get("framework") || null;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB ?? env.DB;
  const now = /* @__PURE__ */ new Date();
  const since = new Date(now.getTime() - days * 864e5).toISOString();
  const dateStr = now.toISOString().slice(0, 10);
  switch (widget) {
    case "compliance-scores":
      return exportComplianceScores(db, user, framework, dateStr);
    case "compliance-trend":
      return exportComplianceTrend(db, user, days, dateStr);
    case "evidence-feed":
      return exportEvidenceFeed(db, user, since, framework, dateStr);
    case "evidence-volume":
      return exportEvidenceVolume(db, user, days, dateStr);
    case "adapter-health":
      return exportAdapterHealth(db, user, dateStr);
    case "automation-metrics":
      return exportAutomationMetrics(db, user, days, dateStr);
    case "automation-recent":
      return exportAutomationRecent(db, user, dateStr);
    case "jml-metrics":
      return exportJmlData(db, user, since, dateStr, "metrics");
    case "jml-adapter-provisions":
      return exportJmlData(db, user, since, dateStr, "provisions");
    case "workflow-runs":
      return exportWorkflowRuns(db, user, dateStr);
    case "security-posture":
      return exportSecurityPosture(db, user, dateStr);
    default:
      return json({ error: `Unknown widget: ${widget}` }, { status: 400 });
  }
};
async function exportComplianceScores(db, user, framework, dateStr) {
  if (!db) return noDb();
  let query = "SELECT * FROM compliance_scores WHERE tenant_id = ?";
  const params = [user.tenantId];
  if (framework) {
    query += " AND framework = ?";
    params.push(framework);
  }
  const { results } = await db.prepare(query).bind(...params).all();
  const rows = toCamel(results ?? []);
  const csv = buildCSV(
    [
      "Framework",
      "Score",
      "Grade",
      "Controls Total",
      "Controls Implemented",
      "Controls Verified",
      "Source"
    ],
    rows.map((r) => [
      r.framework,
      r.score,
      r.grade,
      r.controlsTotal,
      r.controlsImplemented,
      r.controlsVerified,
      r.source
    ])
  );
  return csvResponse(csv, `compliance-scores-${dateStr}.csv`);
}
async function exportComplianceTrend(db, user, days, dateStr) {
  if (!db) return noDb();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { results } = await db.prepare(
    "SELECT framework, score, recorded_at FROM compliance_history WHERE tenant_id = ? AND recorded_at >= ? ORDER BY recorded_at"
  ).bind(user.tenantId, since).all();
  const rows = toCamel(results ?? []);
  const csv = buildCSV(
    ["Date", "Framework", "Score"],
    rows.map((r) => [r.recordedAt, r.framework, r.score])
  );
  return csvResponse(csv, `compliance-trend-${dateStr}.csv`);
}
async function exportEvidenceFeed(db, user, since, framework, dateStr) {
  if (!db) return noDb();
  let query = "SELECT * FROM compliance_evidence WHERE tenant_id = ? AND created_at >= ?";
  const params = [user.tenantId, since];
  if (framework) {
    query += " AND control_id LIKE ?";
    params.push(`${framework.toLowerCase()}%`);
  }
  query += " ORDER BY created_at DESC LIMIT 500";
  const { results } = await db.prepare(query).bind(...params).all();
  const rows = toCamel(results ?? []);
  const csv = buildCSV(
    ["ID", "Framework", "Control ID", "Impact", "Event Type", "Source", "Actor", "Created At"],
    rows.map((r) => [
      r.id,
      r.framework ?? "",
      r.controlId,
      r.impact,
      r.eventType,
      r.source,
      r.actor,
      r.createdAt
    ])
  );
  return csvResponse(csv, `evidence-feed-${dateStr}.csv`);
}
async function exportEvidenceVolume(db, user, days, dateStr) {
  if (!db) return noDb();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { results } = await db.prepare(
    `SELECT strftime('%Y-W%W', created_at) as week, COUNT(*) as count
       FROM compliance_evidence WHERE tenant_id = ? AND created_at >= ?
       GROUP BY week ORDER BY week`
  ).bind(user.tenantId, since).all();
  const rows = results ?? [];
  const csv = buildCSV(
    ["Week", "Evidence Count"],
    rows.map((r) => [r.week, r.count])
  );
  return csvResponse(csv, `evidence-volume-${dateStr}.csv`);
}
async function exportAdapterHealth(db, user, dateStr) {
  if (!db) return noDb();
  const { results } = await db.prepare(
    `SELECT adapter_slug, collected_at, items_count, error
       FROM adapter_collection_health WHERE tenant_id = ?
       ORDER BY collected_at DESC`
  ).bind(user.tenantId).all();
  const rows = results ?? [];
  const csv = buildCSV(
    ["Adapter", "Last Collected", "Items Count", "Error"],
    rows.map((r) => [r.adapter_slug, r.collected_at, r.items_count, r.error ?? ""])
  );
  return csvResponse(csv, `adapter-health-${dateStr}.csv`);
}
async function exportAutomationMetrics(db, user, days, dateStr) {
  if (!db) return noDb();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { results } = await db.prepare(
    `SELECT status, COUNT(*) as cnt FROM automation_executions
       WHERE tenant_id = ? AND started_at >= ? GROUP BY status`
  ).bind(user.tenantId, since).all();
  const rows = results ?? [];
  const csv = buildCSV(
    ["Status", "Count"],
    rows.map((r) => [r.status, r.cnt])
  );
  return csvResponse(csv, `automation-metrics-${dateStr}.csv`);
}
async function exportAutomationRecent(db, user, dateStr) {
  if (!db) return noDb();
  const { results } = await db.prepare(
    `SELECT id, rule_name, status, duration_ms, started_at, completed_at
       FROM automation_executions WHERE tenant_id = ?
       ORDER BY started_at DESC LIMIT 100`
  ).bind(user.tenantId).all();
  const rows = toCamel(results ?? []);
  const csv = buildCSV(
    ["ID", "Rule Name", "Status", "Duration (ms)", "Started At", "Completed At"],
    rows.map((r) => [r.id, r.ruleName, r.status, r.durationMs, r.startedAt, r.completedAt])
  );
  return csvResponse(csv, `automation-recent-${dateStr}.csv`);
}
async function exportJmlData(db, user, since, dateStr, mode) {
  if (!db) return noDb();
  const { results } = await db.prepare(
    "SELECT * FROM workflow_runs WHERE tenant_id = ? AND started_at >= ? ORDER BY started_at DESC"
  ).bind(user.tenantId, since).all();
  const rows = toCamel(results ?? []);
  if (mode === "metrics") {
    const csv2 = buildCSV(
      ["ID", "Type", "Status", "User Email", "App", "Started At", "Completed At"],
      rows.map((r) => [
        r.id,
        r.type,
        r.status,
        r.userEmail ?? r.userId,
        r.appName ?? r.appId,
        r.startedAt,
        r.completedAt
      ])
    );
    return csvResponse(csv2, `jml-metrics-${dateStr}.csv`);
  }
  const appMap = /* @__PURE__ */ new Map();
  for (const run of rows) {
    const appName = run.appName || run.appId || "Unknown";
    if (!appMap.has(appName)) appMap.set(appName, { provisioned: 0, deprovisioned: 0, pending: 0 });
    const entry = appMap.get(appName);
    if (run.status === "completed" || run.status === "success") {
      if (run.type === "leaver") entry.deprovisioned++;
      else entry.provisioned++;
    } else if (run.status === "pending" || run.status === "in_progress") {
      entry.pending++;
    }
  }
  const csv = buildCSV(
    ["App", "Provisioned", "Deprovisioned", "Pending"],
    Array.from(appMap.entries()).map(([app, c]) => [
      app,
      c.provisioned,
      c.deprovisioned,
      c.pending
    ])
  );
  return csvResponse(csv, `adapter-provisions-${dateStr}.csv`);
}
async function exportWorkflowRuns(db, user, dateStr) {
  if (!db) return noDb();
  const { results } = await db.prepare("SELECT * FROM workflow_runs WHERE tenant_id = ? ORDER BY started_at DESC LIMIT 100").bind(user.tenantId).all();
  const rows = toCamel(results ?? []);
  const csv = buildCSV(
    ["ID", "Type", "Status", "User", "App", "Started At", "Completed At"],
    rows.map((r) => [
      r.id,
      r.type,
      r.status,
      r.userEmail ?? r.userId,
      r.appName ?? r.appId,
      r.startedAt,
      r.completedAt
    ])
  );
  return csvResponse(csv, `workflow-runs-${dateStr}.csv`);
}
async function exportSecurityPosture(db, user, dateStr) {
  if (!db) return noDb();
  const [incidents, reviews] = await Promise.all([
    db.prepare("SELECT status, COUNT(*) as cnt FROM incidents WHERE tenant_id = ? GROUP BY status").bind(user.tenantId).all().catch(() => ({ results: [] })),
    db.prepare(
      "SELECT status, COUNT(*) as cnt FROM access_review_campaigns WHERE tenant_id = ? GROUP BY status"
    ).bind(user.tenantId).all().catch(() => ({ results: [] }))
  ]);
  const lines = ["Category,Metric,Value"];
  for (const r of incidents.results ?? []) {
    lines.push(`Incidents,${r.status},${r.cnt}`);
  }
  for (const r of reviews.results ?? []) {
    lines.push(`Access Reviews,${r.status},${r.cnt}`);
  }
  return csvResponse(lines.join("\n"), `security-posture-${dateStr}.csv`);
}
function noDb() {
  return new Response(JSON.stringify({ error: "Database unavailable" }), {
    status: 503,
    headers: { "Content-Type": "application/json" }
  });
}

export { GET };
//# sourceMappingURL=_server.ts-Ca0i0lRo.js.map
