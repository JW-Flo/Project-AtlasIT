import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe.includes("\r")) {
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  return safe;
}

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  const from = url.searchParams.get("from") ?? null;
  const to = url.searchParams.get("to") ?? null;
  const actionFilter = url.searchParams.get("action") ?? null;
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "5000", 10) || 5000, 1),
    5000,
  );

  const filters: string[] = [];
  const binds: (string | number)[] = [];

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
    db
      .prepare(`SELECT COUNT(*) as total FROM audit_log ${where}`)
      .bind(...binds)
      .first()
      .catch(() => ({ total: 0 })),
    db
      .prepare(
        `SELECT id, tenant_id, actor_email, action, target_type, target_id, detail, created_at
         FROM audit_log ${where}
         ORDER BY created_at DESC LIMIT ?`,
      )
      .bind(...binds, limit)
      .all()
      .catch(() => ({ results: [] })),
  ]);

  const entries = (rowsResult.results ?? []).map((row: any) => ({
    date: row.created_at,
    actor: row.actor_email,
    action: row.action,
    target: row.target_type + (row.target_id ? `:${row.target_id}` : ""),
    details: row.detail || "",
  }));

  const total = (countResult as any)?.total ?? 0;

  if (format === "csv") {
    const header = "Date,Actor,Action,Target,Details";
    const rows = entries.map(
      (e: any) =>
        `${escapeCSV(e.date)},${escapeCSV(e.actor)},${escapeCSV(e.action)},${escapeCSV(e.target)},${escapeCSV(e.details)}`,
    );
    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="audit-log-export.csv"',
      },
    });
  }

  return new Response(JSON.stringify({ entries, total }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="audit-log-export.json"',
    },
  });
};
