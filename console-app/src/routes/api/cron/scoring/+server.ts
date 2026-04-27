import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { queryPg, queryPgOne } from "$lib/server/pg";

/**
 * POST /api/cron/scoring
 *
 * Auto-promote control statuses based on evidence density (replaces CF orchestrator duty 4b).
 * For each tenant: read compliance_controls from tenant_preferences,
 * count evidence per framework/control, and promote statuses where thresholds are met.
 * Never demotes or touches `verified`.
 */
export const POST: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_KEY;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await queryPg<{ id: string }>(
    `SELECT id FROM tenants WHERE status = 'active' OR status IS NULL ORDER BY created_at`,
  );

  let totalPromoted = 0;
  const errors: string[] = [];

  for (const tenant of tenants) {
    try {
      const prefRow = await queryPgOne<{ value: string }>(
        `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'compliance_controls'`,
        [tenant.id],
      );

      if (!prefRow?.value) continue;

      let controls: Array<Record<string, string>>;
      try {
        controls = JSON.parse(prefRow.value);
      } catch {
        continue;
      }

      if (!Array.isArray(controls) || controls.length === 0) continue;

      const evidenceRows = await queryPg<{
        framework: string;
        control_id: string;
        cnt: string;
      }>(
        `SELECT framework, control_id, COUNT(*) as cnt
         FROM compliance_evidence
         WHERE tenant_id = $1
         GROUP BY framework, control_id`,
        [tenant.id],
      );

      const frameworkTotals = new Map<string, number>();
      const controlIdCounts = new Map<string, number>();
      for (const ev of evidenceRows) {
        frameworkTotals.set(
          ev.framework,
          (frameworkTotals.get(ev.framework) ?? 0) + Number(ev.cnt),
        );
        controlIdCounts.set(
          ev.control_id,
          (controlIdCounts.get(ev.control_id) ?? 0) + Number(ev.cnt),
        );
      }

      let promoted = 0;
      const updated = controls.map((control) => {
        const status = control.status ?? "not_started";
        if (status === "verified") return control;

        const framework = (control.framework ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
        let frameworkEvidenceCount = 0;
        for (const [fw, cnt] of frameworkTotals) {
          if (fw.toUpperCase().replace(/[^A-Z0-9]/g, "") === framework) {
            frameworkEvidenceCount = cnt;
            break;
          }
        }

        const controlEvidenceCount = controlIdCounts.get(control.id ?? "") ?? 0;

        if (status === "not_started" && frameworkEvidenceCount > 0) {
          promoted++;
          return { ...control, status: "in_progress" };
        }

        if (status === "in_progress" && controlEvidenceCount >= 3) {
          promoted++;
          return { ...control, status: "implemented" };
        }

        return control;
      });

      if (promoted > 0) {
        await queryPg(
          `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
           VALUES ($1, 'compliance_controls', $2, NOW())
           ON CONFLICT(tenant_id, key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [tenant.id, JSON.stringify(updated)],
        );
        totalPromoted += promoted;
      }
    } catch (err) {
      errors.push(`${tenant.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return json({
    promoted: totalPromoted,
    tenants: tenants.length,
    errors: errors.slice(0, 20),
    timestamp: new Date().toISOString(),
  });
};
