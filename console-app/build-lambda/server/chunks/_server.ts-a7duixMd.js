import { json } from '@sveltejs/kit';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

function getDb(platform) {
  const env = platform?.env || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}
const VALID_DECISIONS = ["approved", "rejected", "changes_requested"];
const POST = async ({ params, request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const { id } = params;
  let body;
  try {
    body = await request.json();
    if (!body || !VALID_DECISIONS.includes(body.decision)) {
      return json(
        { error: "decision must be one of: approved, rejected, changes_requested" },
        { status: 400 }
      );
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reviewerEmail = user.email;
  if (!reviewerEmail) {
    return json({ error: "Reviewer email required" }, { status: 422 });
  }
  const decision = body.decision;
  const comment = body.comment ?? null;
  try {
    const policy = await db.prepare(`SELECT id, status FROM policies WHERE id = ? AND tenant_id = ?`).bind(id, tenantId).first();
    if (!policy) return json({ error: "Policy not found" }, { status: 404 });
    if (policy.status !== "pending_review") {
      return json({ error: "Policy is not pending review" }, { status: 422 });
    }
    const approval = await db.prepare(
      `SELECT id FROM policy_approvals
         WHERE policy_id = ? AND reviewer_email = ? AND decision = 'pending'`
    ).bind(id, reviewerEmail).first();
    if (!approval) {
      return json({ error: "You are not a pending reviewer for this policy" }, { status: 403 });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.prepare(
      `UPDATE policy_approvals
         SET decision = ?, comment = ?, decided_at = ?
         WHERE id = ?`
    ).bind(decision, comment, now, approval.id).run();
    let newStatus;
    let approvedBy = null;
    let approvedAt = null;
    if (decision === "approved") {
      const remaining = await db.prepare(
        `SELECT COUNT(*) as cnt FROM policy_approvals WHERE policy_id = ? AND decision = 'pending'`
      ).bind(id).first();
      if ((remaining?.cnt ?? 0) === 0) {
        newStatus = "approved";
        approvedBy = reviewerEmail;
        approvedAt = now;
        await db.prepare(
          `UPDATE policies SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
             WHERE id = ? AND tenant_id = ?`
        ).bind(approvedBy, approvedAt, now, id, tenantId).run();
        try {
          const evidenceId = crypto.randomUUID().replace(/-/g, "");
          await db.prepare(
            `INSERT OR IGNORE INTO compliance_evidence
               (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
               VALUES (?, ?, 'SOC2', 'CC1.1', 'Control environment — policy approved', 'policy_approval', 'console', ?, ?, ?, ?, ?)`
          ).bind(
            evidenceId,
            tenantId,
            id,
            reviewerEmail,
            `policy:${id}`,
            JSON.stringify({ policyId: id, decision, approvedBy }),
            now
          ).run();
        } catch {
        }
      } else {
        newStatus = "pending_review";
      }
    } else {
      newStatus = "draft";
      await db.prepare(
        `UPDATE policies SET status = 'draft', updated_at = ? WHERE id = ? AND tenant_id = ?`
      ).bind(now, id, tenantId).run();
      await db.prepare(
        `UPDATE policy_approvals SET decision = 'superseded', decided_at = ?
           WHERE policy_id = ? AND decision = 'pending'`
      ).bind(now, id).run();
    }
    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: reviewerEmail,
        action: `policy.review.${decision}`,
        targetType: "policy",
        targetId: id,
        detail: JSON.stringify({ decision, comment })
      });
    } catch {
    }
    try {
      const { notify } = await import('./notifications-COLEq-wV.js');
      const notifType = decision === "approved" ? "policy_approved" : "policy_rejected";
      const decisionLabel = decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "returned for changes";
      await notify(db, platform, {
        tenantId,
        type: notifType,
        title: `Policy ${decisionLabel}`,
        body: `Policy was ${decisionLabel} by ${reviewerEmail}${comment ? `: ${comment}` : ""}`,
        severity: decision === "approved" ? "info" : "warning",
        sourceType: "policy",
        sourceId: id,
        sourceLabel: `Policy ${id}`,
        actionUrl: `/console/policies`
      });
    } catch {
    }
    return json({ id, status: newStatus, decision });
  } catch (e) {
    console.error("Failed to record review decision:", e);
    return json({ error: "Failed to record review decision" }, { status: 500 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-a7duixMd.js.map
