/**
 * GET /api/policies/managed — List policies for tenant
 * POST /api/policies/managed — Create new policy (draft)
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");

  let query =
    "SELECT id, title, type, version, status, created_by, approved_by, approved_at, created_at, updated_at FROM policies WHERE tenant_id = ?";
  const params: unknown[] = [tenantId];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY updated_at DESC LIMIT 100";

  try {
    const { results } = await db
      .prepare(query)
      .bind(...params)
      .all();
    const policyIds = (results ?? []).map((r: any) => r.id);

    // Batch-load approval summaries for all policies
    let approvalMap: Record<
      string,
      {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        reviewers: { email: string; decision: string; decidedAt: string | null }[];
      }
    > = {};
    if (policyIds.length > 0) {
      try {
        const placeholders = policyIds.map(() => "?").join(",");
        const { results: approvalRows } = await db
          .prepare(
            `SELECT policy_id, reviewer_email, decision, decided_at FROM policy_approvals WHERE policy_id IN (${placeholders}) ORDER BY created_at ASC`,
          )
          .bind(...policyIds)
          .all();
        for (const row of approvalRows ?? []) {
          const r = row as any;
          if (!approvalMap[r.policy_id]) {
            approvalMap[r.policy_id] = {
              total: 0,
              approved: 0,
              rejected: 0,
              pending: 0,
              reviewers: [],
            };
          }
          const entry = approvalMap[r.policy_id];
          entry.total++;
          if (r.decision === "approved") entry.approved++;
          else if (r.decision === "rejected" || r.decision === "changes_requested")
            entry.rejected++;
          else if (r.decision === "pending") entry.pending++;
          entry.reviewers.push({
            email: r.reviewer_email,
            decision: r.decision,
            decidedAt: r.decided_at ?? null,
          });
        }
      } catch {
        // policy_approvals table may not exist yet
      }
    }

    const items = (results ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      version: row.version,
      status: row.status,
      createdBy: row.created_by ?? null,
      approvedBy: row.approved_by ?? null,
      approvedAt: row.approved_at ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      approvalSummary: approvalMap[row.id] ?? null,
    }));
    return json({ items });
  } catch (e: any) {
    if (e?.message?.includes("no such table")) return json({ items: [] });
    return json({ error: "Failed to load policies" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, type, content } = body;
  if (!title?.trim() || !type?.trim() || !content?.trim()) {
    return json({ error: "Missing required fields: title, type, content" }, { status: 400 });
  }
  const validTypes = [
    "access_control",
    "incident_response",
    "data_handling",
    "password",
    "acceptable_use",
  ];
  if (!validTypes.includes(type)) {
    return json(
      { error: `Invalid policy type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID().replace(/-/g, "");
  const versionId = crypto.randomUUID().replace(/-/g, "");
  const createdBy = user.email ?? "unknown";

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO policies (id, tenant_id, title, type, content, version, status, created_by)
           VALUES (?, ?, ?, ?, ?, 1, 'draft', ?)`,
        )
        .bind(id, tenantId, title.trim(), type.trim(), content.trim(), createdBy),
      db
        .prepare(
          `INSERT INTO policy_versions (id, policy_id, version, content, diff_summary, created_by)
           VALUES (?, ?, 1, ?, 'Initial version', ?)`,
        )
        .bind(versionId, id, content.trim(), createdBy),
    ]);
  } catch (e: any) {
    console.error("Failed to create policy:", e);
    return json({ error: "Failed to create policy" }, { status: 500 });
  }

  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: createdBy,
      action: "policy.created",
      targetType: "policy",
      targetId: id,
      detail: JSON.stringify({ title, type }),
    });
  } catch {
    /* Non-blocking */
  }

  return json({ id, title, type, version: 1, status: "draft" }, { status: 201 });
};
