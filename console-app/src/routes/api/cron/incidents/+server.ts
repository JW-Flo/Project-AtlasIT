import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { queryPg } from "$lib/server/pg";

/**
 * POST /api/cron/incidents
 *
 * Incident SLA breach detection + auto-resolve (replaces CF orchestrator duty 7).
 * - Detects incidents past their SLA deadline and marks them as breached
 * - Auto-resolves incidents flagged for auto-resolution
 */
export const POST: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_KEY;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  let slaBreach = 0;
  let autoResolved = 0;
  const errors: string[] = [];

  // Detect SLA breaches
  try {
    const breached = await queryPg<{
      id: string;
      tenant_id: string;
      title: string;
      severity: string;
    }>(
      `SELECT id, tenant_id, title, severity FROM incidents
       WHERE sla_breach_at <= NOW()
         AND status IN ('open', 'investigating')
         AND (sla_breach_notified = false OR sla_breach_notified IS NULL)
       LIMIT 500`,
    );

    for (const row of breached) {
      try {
        await queryPg(`UPDATE incidents SET sla_breach_notified = true WHERE id = $1`, [row.id]);

        await queryPg(
          `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
           VALUES ($1, $2, $3, 'sla_warning', 'system', 'SLA deadline breached')`,
          [crypto.randomUUID(), row.id, row.tenant_id],
        );

        slaBreach++;
      } catch (err) {
        errors.push(`sla:${row.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    errors.push(`sla_query: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Auto-resolve flagged incidents
  try {
    const autoResolveRows = await queryPg<{ id: string; tenant_id: string }>(
      `SELECT id, tenant_id FROM incidents
       WHERE auto_resolve = true AND status = 'open' AND source = 'automation'
       LIMIT 500`,
    );

    for (const row of autoResolveRows) {
      try {
        await queryPg(
          `UPDATE incidents SET status = 'resolved', resolved_at = NOW() WHERE id = $1`,
          [row.id],
        );

        await queryPg(
          `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
           VALUES ($1, $2, $3, 'auto_action', 'system', 'Incident auto-resolved')`,
          [crypto.randomUUID(), row.id, row.tenant_id],
        );

        autoResolved++;
      } catch (err) {
        errors.push(`resolve:${row.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    errors.push(`resolve_query: ${err instanceof Error ? err.message : String(err)}`);
  }

  return json({
    slaBreach,
    autoResolved,
    errors: errors.slice(0, 20),
    timestamp: new Date().toISOString(),
  });
};
