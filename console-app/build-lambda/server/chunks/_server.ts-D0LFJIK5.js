import { json } from '@sveltejs/kit';

const GET = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId || typeof tenantId !== "string")
    return json({ error: "Tenant context required" }, { status: 403 });
  const env = platform?.env ?? {};
  const db = env.DB ?? env.ATLAS_SHARED_DB;
  if (!db) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Evidence feed: DB unavailable"
      })
    );
    return json({ error: "Database unavailable" }, { status: 503 });
  }
  const rawLimit = Number(url.searchParams.get("limit") ?? "50");
  const limit = Math.min(Number.isNaN(rawLimit) ? 50 : rawLimit, 200);
  const rawOffset = Number(url.searchParams.get("offset") ?? "0");
  const offset = Math.max(Number.isNaN(rawOffset) ? 0 : rawOffset, 0);
  const framework = url.searchParams.get("framework");
  const controlId = url.searchParams.get("controlId");
  const category = url.searchParams.get("category");
  const impact = url.searchParams.get("impact");
  const since = url.searchParams.get("since");
  const FRAMEWORK_DISPLAY_TO_DB = {
    "NIST CSF": "NIST_CSF"
  };
  function toDbFramework(fw) {
    return FRAMEWORK_DISPLAY_TO_DB[fw] ?? fw;
  }
  let tenantFrameworks = null;
  try {
    const fwPref = await db.prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`).bind(tenantId).first();
    if (fwPref?.value) {
      const parsed = JSON.parse(fwPref.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        tenantFrameworks = parsed.map(toDbFramework);
      }
    }
  } catch {
  }
  const conditions = ["ce.tenant_id = ?"];
  const params = [tenantId];
  if (framework) {
    conditions.push("ce.framework = ?");
    params.push(toDbFramework(framework));
  } else if (tenantFrameworks) {
    const placeholders = tenantFrameworks.map(() => "?").join(", ");
    conditions.push(`ce.framework IN (${placeholders})`);
    params.push(...tenantFrameworks);
  }
  if (controlId) {
    const prefixes = url.searchParams.get("controlPrefixes");
    if (prefixes) {
      const prefixList = prefixes.split(",").map((p) => p.trim()).filter(Boolean);
      if (prefixList.length > 0) {
        const likeClauses = prefixList.map(() => "ce.control_id LIKE ?");
        conditions.push(`(${likeClauses.join(" OR ")})`);
        params.push(...prefixList.map((p) => `${p}%`));
      }
    } else {
      conditions.push("ce.control_id = ?");
      params.push(controlId);
    }
  }
  if (category) {
    conditions.push("ce.evidence_type = ?");
    params.push(category);
  }
  if (since) {
    conditions.push("ce.created_at >= ?");
    params.push(since);
  }
  const where = conditions.join(" AND ");
  const [rowsResult, countResult, summaryResult] = await Promise.all([
    db.prepare(
      `SELECT ce.id, ce.framework, ce.control_id, ce.control_name,
                ce.evidence_type, ce.source, ce.actor, ce.subject,
                ce.metadata, ce.source_id, ce.created_at
         FROM compliance_evidence ce
         WHERE ${where}
         ORDER BY ce.created_at DESC
         LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all(),
    db.prepare(`SELECT COUNT(*) AS cnt FROM compliance_evidence ce WHERE ${where}`).bind(...params).first(),
    // Summary stats scoped to tenant's selected frameworks
    (() => {
      if (tenantFrameworks) {
        const ph = tenantFrameworks.map(() => "?").join(", ");
        return db.prepare(
          `SELECT
               COUNT(*) AS total_evidence,
               COUNT(DISTINCT framework) AS framework_count,
               COUNT(DISTINCT control_id) AS control_count
             FROM compliance_evidence
             WHERE tenant_id = ? AND framework IN (${ph})`
        ).bind(tenantId, ...tenantFrameworks).first();
      }
      return db.prepare(
        `SELECT
             COUNT(*) AS total_evidence,
             COUNT(DISTINCT framework) AS framework_count,
             COUNT(DISTINCT control_id) AS control_count
           FROM compliance_evidence
           WHERE tenant_id = ?`
      ).bind(tenantId).first();
    })()
  ]);
  const feed = (rowsResult.results ?? []).map(
    (row) => {
      let meta = {};
      try {
        meta = row.metadata ? JSON.parse(row.metadata) : {};
      } catch {
      }
      const item = {
        id: row.id,
        framework: row.framework,
        controlId: row.control_id,
        controlName: row.control_name ?? null,
        category: row.evidence_type,
        source: row.source,
        actor: row.actor ?? "system",
        subject: row.subject ?? null,
        impact: meta.impact ?? "positive",
        confidence: meta.confidence ?? 1,
        reasoning: meta.reasoning ?? "",
        eventType: meta.eventType ?? "",
        contentHash: row.source_id ?? null,
        createdAt: row.created_at
      };
      return item;
    }
  );
  const filteredFeed = impact ? feed.filter((item) => item.impact === impact) : feed;
  const effectiveTotal = impact ? filteredFeed.length + offset : countResult?.cnt ?? 0;
  const positiveCount = feed.filter((f) => f.impact === "positive").length;
  const detrimentalCount = feed.filter((f) => f.impact === "detrimental").length;
  return json({
    feed: filteredFeed,
    meta: {
      total: impact ? effectiveTotal : countResult?.cnt ?? 0,
      limit,
      offset
    },
    summary: {
      totalEvidence: summaryResult?.total_evidence ?? 0,
      frameworksCovered: summaryResult?.framework_count ?? 0,
      controlsCovered: summaryResult?.control_count ?? 0,
      positiveCount,
      detrimentalCount
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts-D0LFJIK5.js.map
