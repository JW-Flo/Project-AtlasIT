import { json } from '@sveltejs/kit';

function computeTrend(points) {
  if (points.length < 2) return "flat";
  const oldest = points[0].score;
  const latest = points[points.length - 1].score;
  if (latest > oldest + 1) return "up";
  if (latest < oldest - 1) return "down";
  return "flat";
}
const GET = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ history: [] });
  const days = Math.min(Number(url.searchParams.get("days") ?? "30"), 365);
  const sinceParam = url.searchParams.get("since");
  const untilParam = url.searchParams.get("until");
  const since = sinceParam || new Date(Date.now() - days * 864e5).toISOString();
  const until = untilParam || (/* @__PURE__ */ new Date()).toISOString();
  const { results } = await db.prepare(
    `SELECT framework, score, grade,
              date(recorded_at) AS date
       FROM compliance_history
       WHERE tenant_id = ? AND recorded_at >= ? AND recorded_at <= ?
       ORDER BY framework, recorded_at ASC`
  ).bind(tenantId, since, until).all();
  const byFramework = /* @__PURE__ */ new Map();
  for (const row of results ?? []) {
    if (!byFramework.has(row.framework)) {
      byFramework.set(row.framework, /* @__PURE__ */ new Map());
    }
    byFramework.get(row.framework).set(row.date, {
      date: row.date,
      score: row.score,
      grade: row.grade
    });
  }
  const history = [];
  for (const [framework, pointMap] of byFramework) {
    const points = Array.from(pointMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const latestScore = points[points.length - 1]?.score ?? 0;
    history.push({
      framework,
      points,
      trend: computeTrend(points),
      latestScore
    });
  }
  return json({ history, days });
};

export { GET };
//# sourceMappingURL=_server.ts-TH8JU7Yq.js.map
