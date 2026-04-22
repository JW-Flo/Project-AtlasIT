import { json } from '@sveltejs/kit';

function escapeCSV(value) {
  if (value == null) return "";
  const str = String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe.includes("\r")) {
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  return safe;
}
const GET = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  const from = url.searchParams.get("from") ?? null;
  const to = url.searchParams.get("to") ?? null;
  const actionFilter = url.searchParams.get("action") ?? null;
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "5000", 10) || 5e3, 1),
    5e3
  );
  const filters = [];
  const binds = [];
  if (!user.superAdmin) {
    filters.push("tenant_id = ?");
    binds.push(user.tenantId);
  }
  if (from) {
    filters.push("created_at >= ?");
    binds.push(from);
  }
  if (to) {
    filters.push("created_at <= ?");
    binds.push(to);
  }
  if (actionFilter) {
    filters.push("action = ?");
    binds.push(actionFilter);
  }
  const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
  const [countResult, rowsResult] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as total FROM audit_log ${where}`).bind(...binds).first().catch(() => ({ total: 0 })),
    db.prepare(
      `SELECT id, tenant_id, actor_id, action, resource_type, resource_id, details, created_at
         FROM audit_log ${where}
         ORDER BY created_at DESC LIMIT ?`
    ).bind(...binds, limit).all().catch(() => ({ results: [] }))
  ]);
  const entries = (rowsResult.results ?? []).map((row) => {
    let actorEmail = row.actor_id ?? "";
    let detail = "";
    try {
      const parsed = JSON.parse(row.details ?? "{}");
      if (parsed.actorEmail) actorEmail = parsed.actorEmail;
      if (parsed.detail) detail = parsed.detail;
    } catch {
    }
    return {
      date: row.created_at,
      actor: actorEmail,
      action: row.action,
      target: (row.resource_type ?? "") + (row.resource_id ? `:${row.resource_id}` : ""),
      details: detail
    };
  });
  const total = countResult?.total ?? 0;
  if (format === "csv") {
    const header = "Date,Actor,Action,Target,Details";
    const rows = entries.map(
      (e) => `${escapeCSV(e.date)},${escapeCSV(e.actor)},${escapeCSV(e.action)},${escapeCSV(e.target)},${escapeCSV(e.details)}`
    );
    const csv = [header, ...rows].join("\n");
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="audit-log-export.csv"'
      }
    });
  }
  return new Response(JSON.stringify({ entries, total }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="audit-log-export.json"'
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts-C7gyvdh-.js.map
