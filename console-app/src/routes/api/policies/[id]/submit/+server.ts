import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

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
    if (
      !body ||
      !Array.isArray(body.reviewerEmails) ||
      body.reviewerEmails.length === 0
    ) {
      return json({ error: "Missing required field: reviewerEmails (non-empty array)" }, { status: 400 });
    }
    if (!body.reviewerEmails.every((e: unknown) => typeof e === "string" && e.trim())) {
      return json({ error: "reviewerEmails must be an array of non-empty strings" }, { status: 400 });
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const policy = await db
      .prepare(`SELECT id, status FROM policies WHERE id = ? AND tenant_id = ?`)
      .bind(id, tenantId)
      .first<any>();

    if (!policy) return json({ error: "Policy not found" }, { status: 404 });

    if (policy.status !== "draft") {
      return json(
        { error: "Policy can only be submitted for review when in draft status" },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();

    await db
      .prepare(
        `UPDATE policies SET status = 'pending_review', updated_at = ? WHERE id = ? AND tenant_id = ?`,
      )
      .bind(now, id, tenantId)
      .run();

    for (const email of body.reviewerEmails) {
      const approvalId = crypto.randomUUID().replace(/-/g, "");
      await db
        .prepare(
          `INSERT INTO policy_approvals (id, policy_id, version, reviewer_email, decision, created_at)
           VALUES (?, ?, (SELECT version FROM policies WHERE id = ? AND tenant_id = ?), ?, 'pending', ?)`,
        )
        .bind(approvalId, id, id, tenantId, email.trim(), now)
        .run();
    }

    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: user.email ?? "unknown",
        action: "policy.submitted_for_review",
        targetType: "policy",
        targetId: id,
        detail: JSON.stringify({ reviewerEmails: body.reviewerEmails }),
      });
    } catch {
      // Non-blocking
    }

    return json({ id, status: "pending_review" }, { status: 200 });
  } catch (e: any) {
    console.error("Failed to submit policy for review:", e);
    return json({ error: "Failed to submit policy for review" }, { status: 500 });
  }
};
