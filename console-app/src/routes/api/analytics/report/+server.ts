import type { RequestHandler } from "@sveltejs/kit";

/**
 * GET /api/analytics/report?format=csv
 * Generates a downloadable compliance/analytics report.
 * Reuses the same data pipeline as the dashboard API.
 */
export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const format = url.searchParams.get("format") || "csv";
  const db = (platform?.env as any)?.ATLAS_SHARED_DB ?? (platform?.env as any)?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  const tenantId = user.tenantId as string;
  const now = new Date().toISOString().slice(0, 10);

  const STATUS_WEIGHTS: Record<string, number> = {
    not_started: 0,
    in_progress: 0.25,
    implemented: 0.75,
    verified: 1.0,
  };

  // ── Gather data ─────────────────────────────────────────────────────────

  // Framework scores
  let frameworks: Array<{
    framework: string;
    score: number;
    grade: string;
    controlsTotal: number;
    controlsImplemented: number;
    controlsVerified: number;
  }> = [];

  try {
    const { results } = await db
      .prepare(
        `SELECT framework, score, grade, controls_total, controls_implemented, controls_verified
         FROM compliance_scores WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .all();

    frameworks = (results ?? []).map((r: any) => ({
      framework: r.framework,
      score: r.score,
      grade: r.grade,
      controlsTotal: r.controls_total,
      controlsImplemented: r.controls_implemented,
      controlsVerified: r.controls_verified,
    }));
  } catch { /* table may not exist */ }

  // Fallback to tenant_preferences
  if (frameworks.length === 0) {
    try {
      const row = await db
        .prepare(
          `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
        )
        .bind(tenantId)
        .first<{ value: string }>();
      if (row?.value) {
        const controls: Array<{ framework: string; status: string; id: string; name: string }> =
          JSON.parse(row.value);
        const byFw = new Map<string, typeof controls>();
        for (const c of controls) {
          const list = byFw.get(c.framework) ?? [];
          list.push(c);
          byFw.set(c.framework, list);
        }
        for (const [fw, fwControls] of byFw) {
          const total = fwControls.length;
          const weightSum = fwControls.reduce((s, c) => s + (STATUS_WEIGHTS[c.status] ?? 0), 0);
          const score = total > 0 ? Math.round((weightSum / total) * 100 * 10) / 10 : 0;
          let grade = "F";
          if (score >= 90) grade = "A";
          else if (score >= 80) grade = "B";
          else if (score >= 70) grade = "C";
          else if (score >= 60) grade = "D";
          frameworks.push({
            framework: fw,
            score,
            grade,
            controlsTotal: total,
            controlsImplemented: fwControls.filter(
              (c) => c.status === "implemented" || c.status === "verified",
            ).length,
            controlsVerified: fwControls.filter((c) => c.status === "verified").length,
          });
        }
      }
    } catch { /* ignore */ }
  }

  // Controls detail
  let controls: Array<{ id: string; name: string; framework: string; status: string }> = [];
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
      )
      .bind(tenantId)
      .first<{ value: string }>();
    if (row?.value) {
      controls = JSON.parse(row.value);
    }
  } catch { /* ignore */ }

  // Automation metrics
  let automationTotal = 0;
  let automationActive = 0;
  let automationExecutions = 0;
  let automationSuccessRate = 0;
  try {
    const ruleRow = await db
      .prepare(
        `SELECT COUNT(*) AS total, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) AS active FROM automation_rules WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .first<{ total: number; active: number }>();
    automationTotal = ruleRow?.total ?? 0;
    automationActive = ruleRow?.active ?? 0;

    const execRow = await db
      .prepare(
        `SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS success
         FROM automation_executions WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .first<{ total: number; success: number }>();
    automationExecutions = execRow?.total ?? 0;
    automationSuccessRate =
      automationExecutions > 0
        ? Math.round(((execRow?.success ?? 0) / automationExecutions) * 100)
        : 0;
  } catch { /* ignore */ }

  // Overall score
  const overallScore =
    frameworks.length > 0
      ? Math.round(
          (frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length) * 10,
        ) / 10
      : 0;

  // ── Generate CSV ────────────────────────────────────────────────────────

  const lines: string[] = [];
  lines.push(`AtlasIT Compliance & Analytics Report`);
  lines.push(`Generated: ${now}`);
  lines.push(`Tenant: ${tenantId}`);
  lines.push(``);

  // Summary
  lines.push(`SUMMARY`);
  lines.push(`Overall Compliance Score,${overallScore}%`);
  lines.push(`Frameworks Tracked,${frameworks.length}`);
  lines.push(`Automation Rules,${automationTotal} (${automationActive} active)`);
  lines.push(`Automation Executions,${automationExecutions}`);
  lines.push(`Automation Success Rate,${automationSuccessRate}%`);
  lines.push(``);

  // Framework breakdown
  lines.push(`FRAMEWORK SCORES`);
  lines.push(`Framework,Score,Grade,Controls Total,Controls Implemented,Controls Verified`);
  for (const fw of frameworks) {
    lines.push(
      `${csvEscape(fw.framework)},${fw.score}%,${fw.grade},${fw.controlsTotal},${fw.controlsImplemented},${fw.controlsVerified}`,
    );
  }
  lines.push(``);

  // Control details
  if (controls.length > 0) {
    lines.push(`CONTROL DETAILS`);
    lines.push(`Control ID,Name,Framework,Status,Score`);
    for (const c of controls) {
      const score = Math.round((STATUS_WEIGHTS[c.status] ?? 0) * 100);
      lines.push(
        `${csvEscape(c.id)},${csvEscape(c.name)},${csvEscape(c.framework)},${c.status},${score}%`,
      );
    }
  }

  const csv = lines.join("\n");
  const filename = `atlasit-compliance-report-${now}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
};

function csvEscape(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
