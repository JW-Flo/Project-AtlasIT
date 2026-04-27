import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { queryPg } from "$lib/server/pg";

/**
 * POST /api/cron/intelligence
 *
 * Compliance intelligence scan (replaces CF orchestrator duty 6).
 * Analyzes evidence gaps per framework/control and writes insights.
 * Simplified from CF version — uses direct PG queries instead of
 * shared lib functions that depend on D1 binding types.
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

  let insightsWritten = 0;
  const errors: string[] = [];
  const scoringFrameworks = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"];

  for (const tenant of tenants) {
    try {
      // Gap analysis: find frameworks with zero or very low evidence
      const evidenceCounts = await queryPg<{ framework: string; cnt: string }>(
        `SELECT framework, COUNT(*) as cnt
         FROM compliance_evidence
         WHERE tenant_id = $1
         GROUP BY framework`,
        [tenant.id],
      );

      const fwCounts = new Map<string, number>();
      for (const row of evidenceCounts) {
        fwCounts.set(row.framework, Number(row.cnt));
      }

      for (const fw of scoringFrameworks) {
        const count = fwCounts.get(fw) ?? 0;
        if (count === 0) {
          try {
            await queryPg(
              `INSERT INTO compliance_insights
               (id, tenant_id, insight_type, severity, category, data, created_at)
               VALUES ($1, $2, 'gap', 'high', $3, $4, NOW())
               ON CONFLICT DO NOTHING`,
              [
                crypto.randomUUID(),
                tenant.id,
                fw,
                JSON.stringify({
                  framework: fw,
                  evidenceCount: 0,
                  priority: "high",
                  recommendation: `No evidence collected for ${fw}. Connect adapters that cover this framework.`,
                }),
              ],
            );
            insightsWritten++;
          } catch {
            // table may not exist — skip
          }
        }
      }

      // Drift detection: check for recent score drops
      const recentScores = await queryPg<{
        framework: string;
        score: string;
        created_at: string;
      }>(
        `SELECT framework, score, created_at
         FROM compliance_scores
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [tenant.id],
      ).catch(() => [] as Array<{ framework: string; score: string; created_at: string }>);

      // Group by framework, detect if latest score < previous score
      const frameworkScores = new Map<string, number[]>();
      for (const row of recentScores) {
        const scores = frameworkScores.get(row.framework) ?? [];
        scores.push(Number(row.score));
        frameworkScores.set(row.framework, scores);
      }

      for (const [fw, scores] of frameworkScores) {
        if (scores.length >= 2 && scores[0] < scores[1]) {
          const delta = scores[0] - scores[1];
          if (delta <= -5) {
            try {
              await queryPg(
                `INSERT INTO compliance_insights
                 (id, tenant_id, insight_type, severity, category, data, created_at)
                 VALUES ($1, $2, 'drift', $3, $4, $5, NOW())
                 ON CONFLICT DO NOTHING`,
                [
                  crypto.randomUUID(),
                  tenant.id,
                  delta <= -15 ? "critical" : "warning",
                  fw,
                  JSON.stringify({
                    framework: fw,
                    currentScore: scores[0],
                    previousScore: scores[1],
                    delta,
                    alertType: "score_regression",
                  }),
                ],
              );
              insightsWritten++;
            } catch {
              // skip
            }
          }
        }
      }

      // Stale evidence detection: adapters not reporting in 7+ days
      const staleAdapters = await queryPg<{ source: string; latest: string }>(
        `SELECT source, MAX(created_at) as latest
         FROM compliance_evidence
         WHERE tenant_id = $1
         GROUP BY source
         HAVING MAX(created_at) < NOW() - INTERVAL '7 days'`,
        [tenant.id],
      ).catch(() => [] as Array<{ source: string; latest: string }>);

      for (const adapter of staleAdapters) {
        try {
          await queryPg(
            `INSERT INTO compliance_insights
             (id, tenant_id, insight_type, severity, category, data, created_at)
             VALUES ($1, $2, 'anomaly', 'warning', $3, $4, NOW())
             ON CONFLICT DO NOTHING`,
            [
              crypto.randomUUID(),
              tenant.id,
              "adapter_health",
              JSON.stringify({
                anomalyType: "stale_evidence",
                source: adapter.source,
                lastSeen: adapter.latest,
                recommendation: `Adapter ${adapter.source} has not reported evidence in 7+ days. Check connection status.`,
              }),
            ],
          );
          insightsWritten++;
        } catch {
          // skip
        }
      }
    } catch (err) {
      errors.push(`${tenant.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return json({
    insightsWritten,
    tenants: tenants.length,
    errors: errors.slice(0, 20),
    timestamp: new Date().toISOString(),
  });
};
