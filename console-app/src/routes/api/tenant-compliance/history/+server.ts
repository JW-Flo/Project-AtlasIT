/**
 * GET /api/tenant-compliance/history
 *
 * Returns per-framework compliance score history for the last N days (default 30).
 * Groups results by framework and returns an array of { date, score, grade } points
 * suitable for sparkline / chart rendering.
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface HistoryPoint {
  date: string;
  score: number;
  grade: string;
}

interface FrameworkHistory {
  framework: string;
  points: HistoryPoint[];
  trend: "up" | "down" | "flat";
  latestScore: number;
}

function computeTrend(points: HistoryPoint[]): "up" | "down" | "flat" {
  if (points.length < 2) return "flat";
  const oldest = points[0].score;
  const latest = points[points.length - 1].score;
  if (latest > oldest + 1) return "up";
  if (latest < oldest - 1) return "down";
  return "flat";
}

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ history: [] });

  const days = Math.min(Number(url.searchParams.get("days") ?? "30"), 90);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const { results } = await db
    .prepare(
      `SELECT framework, score, grade,
              date(recorded_at) AS date
       FROM compliance_history
       WHERE tenant_id = ? AND recorded_at >= ?
       ORDER BY framework, recorded_at ASC`,
    )
    .bind(tenantId, since)
    .all<{ framework: string; score: number; grade: string; date: string }>();

  // Group by framework, de-duplicate by keeping last score per day
  const byFramework = new Map<string, Map<string, HistoryPoint>>();
  for (const row of results ?? []) {
    if (!byFramework.has(row.framework)) {
      byFramework.set(row.framework, new Map());
    }
    // later row on same date overwrites earlier — keeps latest score for that day
    byFramework.get(row.framework)!.set(row.date, {
      date: row.date,
      score: row.score,
      grade: row.grade,
    });
  }

  const history: FrameworkHistory[] = [];
  for (const [framework, pointMap] of byFramework) {
    const points = Array.from(pointMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const latestScore = points[points.length - 1]?.score ?? 0;
    history.push({
      framework,
      points,
      trend: computeTrend(points),
      latestScore,
    });
  }

  return json({ history, days });
};
