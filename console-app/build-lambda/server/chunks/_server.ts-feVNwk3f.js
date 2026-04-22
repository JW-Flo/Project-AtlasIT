import { json } from '@sveltejs/kit';

function computeGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
function gradeColor(grade) {
  switch (grade) {
    case "A":
      return "#22c55e";
    case "B":
      return "#84cc16";
    case "C":
      return "#eab308";
    case "D":
      return "#f97316";
    default:
      return "#ef4444";
  }
}
function generateBadgeSvg(tenantName, score, grade) {
  const color = gradeColor(grade);
  const labelWidth = 100;
  const valueWidth = 50;
  const totalWidth = labelWidth + valueWidth;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="Compliance: ${grade} (${score}%)">
  <title>Compliance: ${grade} (${score}%)</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">Compliance</text>
    <text x="${labelWidth / 2}" y="14">Compliance</text>
    <text aria-hidden="true" x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${grade} ${score}%</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${grade} ${score}%</text>
  </g>
</svg>`;
}
const GET = async ({ params, url, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });
  const format = url.searchParams.get("format");
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  const tenant = await db.prepare(`SELECT id, name FROM tenants WHERE slug = ? LIMIT 1`).bind(slug).first();
  if (!tenant) return json({ error: "Not found" }, { status: 404 });
  const pubPref = await db.prepare(
    `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_public'`
  ).bind(tenant.id).first();
  if (pubPref?.value !== "true") {
    return json({ error: "Not found" }, { status: 404 });
  }
  const { results: scoreRows } = await db.prepare(`SELECT framework, score FROM compliance_scores WHERE tenant_id = ?`).bind(tenant.id).all();
  const scores = scoreRows ?? [];
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length) : 0;
  const grade = computeGrade(avgScore);
  if (format === "json") {
    return json({
      tenant: tenant.name,
      slug,
      score: avgScore,
      grade,
      frameworks: scores.map((r) => ({
        name: r.framework,
        score: r.score,
        grade: computeGrade(r.score)
      })),
      trustCenterUrl: `/trust/${slug}`
    });
  }
  const svg = generateBadgeSvg(tenant.name, avgScore, grade);
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=300"
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts-feVNwk3f.js.map
