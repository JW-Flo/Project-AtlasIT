/**
 * GET /api/compliance/evidence-feed
 *
 * Returns a tenant-scoped feed of compliance evidence items with control tags,
 * impact classification, and lifecycle context. Powers the hero "Evidence Activity
 * Feed" UI — showing real-time evidence generation from lifecycle operations.
 *
 * Query params:
 *   - limit (default 50, max 200)
 *   - offset (default 0)
 *   - framework (SOC2, ISO27001, NIST_CSF, HIPAA, GDPR)
 *   - controlId (e.g. CC6.1, A.9.2.6)
 *   - category (access_grant, access_revoke, offboarding, onboarding, etc.)
 *   - impact (positive, detrimental, neutral) — filters via metadata JSON
 *   - since (ISO date — only events after this date)
 *
 * Response:
 *   {
 *     feed: EvidenceFeedItem[],
 *     meta: { total, limit, offset },
 *     summary: { totalEvidence, positiveCount, detrimentalCount, frameworkCoverage }
 *   }
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface EvidenceFeedItem {
  id: string;
  framework: string;
  controlId: string;
  controlName: string | null;
  category: string;
  source: string;
  actor: string;
  subject: string | null;
  impact: string;
  confidence: number;
  reasoning: string;
  eventType: string;
  contentHash: string | null;
  createdAt: string;
}

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as { tenantId?: string } | undefined;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId || typeof tenantId !== "string")
    return json({ error: "Tenant context required" }, { status: 403 });

  const env = (platform?.env as Record<string, unknown>) ?? {};
  const db = (env.DB ?? env.ATLAS_SHARED_DB) as D1Database | undefined;
  if (!db) {
    console.error(JSON.stringify({ level: "error", message: "Evidence feed: DB unavailable" }));
    return json({ error: "Database unavailable" }, { status: 503 });
  }

  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);
  const framework = url.searchParams.get("framework");
  const controlId = url.searchParams.get("controlId");
  const category = url.searchParams.get("category");
  const impact = url.searchParams.get("impact");
  const since = url.searchParams.get("since");

  // Build query
  const conditions = ["ce.tenant_id = ?"];
  const params: unknown[] = [tenantId];

  if (framework) {
    conditions.push("ce.framework = ?");
    params.push(framework);
  }
  if (controlId) {
    conditions.push("ce.control_id = ?");
    params.push(controlId);
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

  // Fetch feed items + count in parallel
  const [rowsResult, countResult, summaryResult] = await Promise.all([
    db
      .prepare(
        `SELECT ce.id, ce.framework, ce.control_id, ce.control_name,
                ce.evidence_type, ce.source, ce.actor, ce.subject,
                ce.metadata, ce.source_id, ce.created_at
         FROM compliance_evidence ce
         WHERE ${where}
         ORDER BY ce.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(...params, limit, offset)
      .all(),
    db
      .prepare(`SELECT COUNT(*) AS cnt FROM compliance_evidence ce WHERE ${where}`)
      .bind(...params)
      .first<{ cnt: number }>(),
    // Summary stats for the entire tenant (unfiltered)
    db
      .prepare(
        `SELECT
           COUNT(*) AS total_evidence,
           COUNT(DISTINCT framework) AS framework_count,
           COUNT(DISTINCT control_id) AS control_count
         FROM compliance_evidence
         WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .first<{ total_evidence: number; framework_count: number; control_count: number }>(),
  ]);

  // Parse metadata to extract impact, confidence, reasoning, eventType
  const feed: EvidenceFeedItem[] = (rowsResult.results ?? []).map(
    (row: Record<string, unknown>) => {
      let meta: Record<string, unknown> = {};
      try {
        meta = row.metadata ? JSON.parse(row.metadata as string) : {};
      } catch {
        // ignore parse errors
      }

      const item: EvidenceFeedItem = {
        id: row.id as string,
        framework: row.framework as string,
        controlId: row.control_id as string,
        controlName: (row.control_name as string) ?? null,
        category: row.evidence_type as string,
        source: row.source as string,
        actor: (row.actor as string) ?? "system",
        subject: (row.subject as string) ?? null,
        impact: (meta.impact as string) ?? "positive",
        confidence: (meta.confidence as number) ?? 1.0,
        reasoning: (meta.reasoning as string) ?? "",
        eventType: (meta.eventType as string) ?? "",
        contentHash: (row.source_id as string) ?? null,
        createdAt: row.created_at as string,
      };

      return item;
    },
  );

  // Filter by impact in app layer (stored in metadata JSON)
  const filteredFeed = impact
    ? feed.filter((item) => item.impact === impact)
    : feed;

  // Count positive/detrimental from the current page for summary
  const positiveCount = filteredFeed.filter((f) => f.impact === "positive").length;
  const detrimentalCount = filteredFeed.filter((f) => f.impact === "detrimental").length;

  return json({
    feed: filteredFeed,
    meta: {
      total: countResult?.cnt ?? 0,
      limit,
      offset,
    },
    summary: {
      totalEvidence: summaryResult?.total_evidence ?? 0,
      frameworksCovered: summaryResult?.framework_count ?? 0,
      controlsCovered: summaryResult?.control_count ?? 0,
      positiveCount,
      detrimentalCount,
    },
  });
};
