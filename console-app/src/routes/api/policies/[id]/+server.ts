import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

export const GET: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const { id } = params;

  try {
    const policy = await db
      .prepare(
        `SELECT id, tenant_id, title, type, content, version, status,
                created_by, approved_by, approved_at, created_at, updated_at
         FROM policies
         WHERE id = ? AND tenant_id = ?`,
      )
      .bind(id, tenantId)
      .first<any>();

    if (!policy) return json({ error: "Policy not found" }, { status: 404 });

    const [versionsResult, approvalsResult] = await Promise.all([
      db
        .prepare(
          `SELECT id, policy_id, version, content, diff_summary, created_by, created_at
           FROM policy_versions
           WHERE policy_id = ?
           ORDER BY version DESC`,
        )
        .bind(id)
        .all<any>(),
      db
        .prepare(
          `SELECT id, policy_id, reviewer_email, decision, comment, decided_at, created_at
           FROM policy_approvals
           WHERE policy_id = ?
           ORDER BY created_at ASC`,
        )
        .bind(id)
        .all<any>(),
    ]);

    return json({
      policy: {
        id: policy.id,
        tenantId: policy.tenant_id,
        title: policy.title,
        type: policy.type,
        content: policy.content,
        version: policy.version,
        status: policy.status,
        createdBy: policy.created_by,
        approvedBy: policy.approved_by ?? null,
        approvedAt: policy.approved_at ?? null,
        createdAt: policy.created_at,
        updatedAt: policy.updated_at,
      },
      versions: (versionsResult.results ?? []).map((v: any) => ({
        id: v.id,
        policyId: v.policy_id,
        version: v.version,
        content: v.content,
        diffSummary: v.diff_summary ?? null,
        createdBy: v.created_by,
        createdAt: v.created_at,
      })),
      approvals: (approvalsResult.results ?? []).map((a: any) => ({
        id: a.id,
        policyId: a.policy_id,
        reviewerEmail: a.reviewer_email,
        decision: a.decision ?? null,
        comment: a.comment ?? null,
        decidedAt: a.decided_at ?? null,
        createdAt: a.created_at,
      })),
    });
  } catch (e: any) {
    if (e?.message?.includes("no such table")) {
      return json({ error: "Policy not found" }, { status: 404 });
    }
    return json({ error: "Failed to load policy" }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const { id } = params;

  let body: any;
  try {
    body = await request.json();
    if (!body || typeof body.content !== "string" || !body.content.trim()) {
      return json({ error: "Missing required field: content" }, { status: 400 });
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const policy = await db
      .prepare(
        `SELECT id, version, status FROM policies WHERE id = ? AND tenant_id = ?`,
      )
      .bind(id, tenantId)
      .first<any>();

    if (!policy) return json({ error: "Policy not found" }, { status: 404 });

    if (policy.status !== "draft") {
      return json(
        { error: "Policy can only be updated when in draft status" },
        { status: 422 },
      );
    }

    const newVersion = (policy.version ?? 1) + 1;
    const versionId = crypto.randomUUID().replace(/-/g, "");
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO policy_versions (id, policy_id, version, content, diff_summary, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        versionId,
        id,
        newVersion,
        body.content,
        body.diffSummary ?? null,
        user.email ?? user.userId ?? "unknown",
        now,
      )
      .run();

    await db
      .prepare(
        `UPDATE policies SET content = ?, version = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`,
      )
      .bind(body.content, newVersion, now, id, tenantId)
      .run();

    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: user.email ?? "unknown",
        action: "policy.updated",
        targetType: "policy",
        targetId: id,
        detail: JSON.stringify({ version: newVersion, diffSummary: body.diffSummary }),
      });
    } catch {
      // Non-blocking
    }

    return json({ id, version: newVersion, status: "draft" });
  } catch (e: any) {
    console.error("Failed to update policy:", e);
    return json({ error: "Failed to update policy" }, { status: 500 });
  }
};
