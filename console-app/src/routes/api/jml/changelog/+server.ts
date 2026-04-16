import type { RequestHandler } from "@sveltejs/kit";
import { toCamel } from "$lib/utils/dto";
import { queryPg, queryPgOne } from "$lib/server/pg";

/** GET — list directory changelog entries, enriched with workflow data */
export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10), 0);
  const action = url.searchParams.get("action");

  const filters: string[] = ["c.tenant_id = $1"];
  const params: unknown[] = [user.tenantId];

  if (action) {
    params.push(action);
    filters.push(`c.jml_action = $${params.length}`);
  }

  const where = filters.join(" AND ");

  params.push(limit, offset);
  const [results, countRow] = await Promise.all([
    queryPg<any>(
      `SELECT
          c.id,
          c.tenant_id,
          c.user_id,
          c.email,
          c.change_type,
          c.delta,
          c.jml_action,
          c.workflow_run_id,
          c.source,
          c.processed,
          c.created_at,
          w.status AS workflow_status,
          w.steps_total AS workflow_steps_total,
          w.steps_done AS workflow_steps_done,
          w.context AS workflow_context,
          du.email AS dir_email,
          du.display_name AS dir_display_name
        FROM directory_changelog c
        LEFT JOIN workflow_runs w ON w.id = c.workflow_run_id
        LEFT JOIN directory_users du ON du.id = c.user_id AND du.tenant_id = c.tenant_id
        WHERE ${where}
        ORDER BY c.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    ),
    queryPgOne<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM directory_changelog c WHERE ${where}`,
      params.slice(0, -2),
    ),
  ]);

  // Enrich each entry with computed fields
  const enriched = results.map((row: any) => {
    // Resolve email: prefer changelog email, fall back to directory_users
    const email = row.email || row.dir_email || null;
    const displayName = row.dir_display_name || null;

    // Parse delta JSON
    let delta: Record<string, any> = {};
    try {
      delta = row.delta ? JSON.parse(row.delta) : {};
    } catch {
      delta = {};
    }

    // Compute apps provisioned/deprovisioned from workflow context or steps
    let appsProvisioned = 0;
    let appsDeprovisioned = 0;
    let policyApplied: string | null = null;

    // Try to extract from workflow context (contains the JML classification data)
    if (row.workflow_context) {
      try {
        const ctx = JSON.parse(row.workflow_context);
        // The workflow context has appAccess (current apps) and workflowType
        if (ctx.workflowType) {
          policyApplied = `auto-${ctx.workflowType}`;
        }
      } catch {}
    }

    // Count provision/deprovision steps from workflow_steps_total
    // The steps include: resolve_access + N provision/deprovision steps
    if (row.workflow_steps_total && row.workflow_steps_total > 1) {
      const appSteps = row.workflow_steps_total - 1; // subtract resolve_access step
      const jmlAction = row.jml_action;
      if (jmlAction === "joiner" || jmlAction === "rehire") {
        appsProvisioned = appSteps;
      } else if (jmlAction === "leaver") {
        appsDeprovisioned = appSteps;
      } else if (jmlAction === "mover") {
        // For movers, we can't precisely split without parsing step names
        // Approximate: half revoke, half provision
        appsDeprovisioned = Math.ceil(appSteps / 2);
        appsProvisioned = Math.floor(appSteps / 2);
      }
    }

    // If no workflow, derive policy from jml_action alone
    if (!policyApplied && row.jml_action) {
      policyApplied = `auto-${row.jml_action}`;
    }

    return {
      id: row.id,
      tenant_id: row.tenant_id,
      user_id: row.user_id,
      email,
      display_name: displayName,
      change_type: row.change_type,
      delta,
      jml_action: row.jml_action,
      workflow_run_id: row.workflow_run_id,
      workflow_status: row.workflow_status || null,
      workflow_steps_total: row.workflow_steps_total || 0,
      workflow_steps_done: row.workflow_steps_done || 0,
      source: row.source,
      processed: row.processed,
      created_at: row.created_at,
      policy_applied: policyApplied,
      apps_provisioned: appsProvisioned,
      apps_deprovisioned: appsDeprovisioned,
    };
  });

  return json({ entries: toCamel(enriched), total: countRow?.cnt ?? 0 });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
