import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

const VALID_DECISIONS = ["approved", "rejected", "changes_requested"] as const;
type Decision = (typeof VALID_DECISIONS)[number];

export const POST: RequestHandler = async ({ params, request, platform, locals }) => {
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
    if (!body || !VALID_DECISIONS.includes(body.decision)) {
      return json(
        { error: "decision must be one of: approved, rejected, changes_requested" },
        { status: 400 },
      );
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reviewerEmail = user.email;
  if (!reviewerEmail) {
    return json({ error: "Reviewer email required" }, { status: 422 });
  }

  const decision = body.decision as Decision;
  const comment: string | null = body.comment ?? null;

  try {
    const policy = await db
      .prepare(`SELECT id, status FROM policies WHERE id = ? AND tenant_id = ?`)
      .bind(id, tenantId)
      .first<any>();

    if (!policy) return json({ error: "Policy not found" }, { status: 404 });

    if (policy.status !== "pending_review") {
      return json(
        { error: "Policy is not pending review" },
        { status: 422 },
      );
    }

    // Verify requesting user is a pending reviewer
    const approval = await db
      .prepare(
        `SELECT id FROM policy_approvals
         WHERE policy_id = ? AND reviewer_email = ? AND decision = 'pending'`,
      )
      .bind(id, reviewerEmail)
      .first<any>();

    if (!approval) {
      return json(
        { error: "You are not a pending reviewer for this policy" },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();

    // Record reviewer's decision
    await db
      .prepare(
        `UPDATE policy_approvals
         SET decision = ?, comment = ?, decided_at = ?
         WHERE id = ?`,
      )
      .bind(decision, comment, now, approval.id)
      .run();

    let newStatus: string;
    let approvedBy: string | null = null;
    let approvedAt: string | null = null;

    if (decision === "approved") {
      newStatus = "approved";
      approvedBy = reviewerEmail;
      approvedAt = now;
      await db
        .prepare(
          `UPDATE policies SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
           WHERE id = ? AND tenant_id = ?`,
        )
        .bind(approvedBy, approvedAt, now, id, tenantId)
        .run();

      // Write compliance evidence for policy approval (CC1.1, A.5.1)
      try {
        const evidenceId = crypto.randomUUID().replace(/-/g, "");
        await db
          .prepare(
            `INSERT OR IGNORE INTO compliance_evidence
             (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
             VALUES (?, ?, 'SOC2', 'CC1.1', 'Control environment — policy approved', 'policy_approval', 'console', ?, ?, ?, ?, ?)`,
          )
          .bind(evidenceId, tenantId, id, reviewerEmail, `policy:${id}`, JSON.stringify({ policyId: id, decision, approvedBy }), now)
          .run();
      } catch { /* best-effort evidence write */ }
    } else {
      // rejected or changes_requested — revert to draft
      newStatus = "draft";
      await db
        .prepare(
          `UPDATE policies SET status = 'draft', updated_at = ? WHERE id = ? AND tenant_id = ?`,
        )
        .bind(now, id, tenantId)
        .run();
    }

    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: reviewerEmail,
        action: `policy.review.${decision}`,
        targetType: "policy",
        targetId: id,
        detail: JSON.stringify({ decision, comment }),
      });
    } catch {
      // Non-blocking
    }

    return json({ id, status: newStatus, decision });
  } catch (e: any) {
    console.error("Failed to record review decision:", e);
    return json({ error: "Failed to record review decision" }, { status: 500 });
  }
};
