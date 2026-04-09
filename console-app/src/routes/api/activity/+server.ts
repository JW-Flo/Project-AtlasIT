import type { RequestHandler } from "@sveltejs/kit";

/** GET — fetch recent activity stream for tenant */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const db = getSharedDb(platform);
  if (!db) return json({ error: "Database unavailable" }, 503);

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const afterId = parseInt(url.searchParams.get("after") ?? "0", 10);
  const types = url.searchParams.get("types")?.split(",").filter(Boolean);

  // Primary: query automation_executions (always has data when rules run)
  // Fallback: activity_stream table (may be empty if not yet populated)
  let query = `SELECT e.id, e.rule_id, r.name AS rule_name, e.trigger_event,
                      e.status, e.actions_run, e.actions_failed, e.duration_ms,
                      e.started_at, e.completed_at
               FROM automation_executions e
               LEFT JOIN automation_rules r ON r.id = e.rule_id
               WHERE e.tenant_id = ?`;
  const params: unknown[] = [user.tenantId];

  if (afterId > 0) {
    query += " AND CAST(e.id AS TEXT) > ?";
    params.push(String(afterId));
  }

  query += " ORDER BY e.started_at DESC LIMIT ?";
  params.push(limit);

  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all();

  return json({
    activities: (results ?? []).map((row: any) => {
      const te = safeJsonParse(row.trigger_event);
      const payload = (te as any)?.payload ?? te;
      return {
        id: row.id,
        eventType: (te as any)?.type ?? "automation",
        title: row.rule_name ?? "Automation execution",
        detail: payload?.email
          ? `${row.status} — ${payload.email}`
          : `${row.status} — ${row.actions_run ?? 0} action(s)`,
        severity: row.status === "failed" ? "error" : row.status === "success" ? "success" : "info",
        entityType: "automation_execution",
        entityId: row.rule_id,
        actor: payload?.email ?? "system",
        metadata: {
          durationMs: row.duration_ms,
          actionsRun: row.actions_run,
          actionsFailed: row.actions_failed,
        },
        createdAt: row.started_at,
      };
    }),
  });
};

function getSharedDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.DB ?? env.ATLAS_SHARED_DB ?? null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function safeJsonParse(val: string | null | undefined): unknown {
  if (!val) return {};
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
}
