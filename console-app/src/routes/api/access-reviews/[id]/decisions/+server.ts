import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getCampaign, submitDecision } from "$lib/server/access-reviews";
import { writeAudit } from "$lib/server/audit";
import { requireTenantRole } from "$lib/server/guards";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user!;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const campaignId = params.id!;
  const campaign = await queryPgOne<any>(
    `SELECT * FROM access_review_campaigns WHERE tenant_id = $1 AND id = $2`,
    [tenantId, campaignId],
  );
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status === "completed" || campaign.status === "expired") {
    return json({ error: "Campaign is no longer active" }, { status: 409 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { itemId, decision, notes } = body ?? {};
  if (!itemId || !decision || !["approved", "revoked"].includes(decision)) {
    return json(
      { error: "itemId and decision ('approved' | 'revoked') are required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const decisionId = crypto.randomUUID();

  // Update the item status
  await queryPg(
    `UPDATE access_review_items
     SET status = $1, decided_at = $2, decided_by = $3, notes = $4
     WHERE id = $5 AND tenant_id = $6 AND campaign_id = $7`,
    [
      decision,
      now,
      user.email ?? user.userId ?? "unknown",
      notes ?? null,
      itemId,
      tenantId,
      campaignId,
    ],
  );

  // Append to decisions log
  await queryPg(
    `INSERT INTO access_review_decisions
       (id, item_id, campaign_id, tenant_id, decision, decided_by, decided_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      decisionId,
      itemId,
      campaignId,
      tenantId,
      decision,
      user.email ?? user.userId ?? "unknown",
      now,
      notes ?? null,
    ],
  );

  // Auto-complete campaign if all items decided
  const pending = await queryPgOne<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM access_review_items WHERE campaign_id = $1 AND status = 'pending'`,
    [campaignId],
  );

  if ((pending?.cnt ?? 1) === 0) {
    await queryPg(
      `UPDATE access_review_campaigns SET status = 'completed', completed_at = $1 WHERE id = $2 AND tenant_id = $3`,
      [now, campaignId, tenantId],
    );
  }

  await queryPg(
    `INSERT INTO audit_log (id, tenant_id, actor_id, action, resource_type, resource_id, details, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      crypto.randomUUID(),
      tenantId,
      user.userId ?? "unknown",
      `access_review.${decision}`,
      "access_review_item",
      itemId,
      JSON.stringify({
        actorEmail: user.email ?? "unknown",
        detail: JSON.stringify({ campaignId, decision }),
      }),
    ],
  );

  // Emit compliance evidence for the access review decision
  const orchestratorUrl = (platform?.env as any)?.ORCHESTRATOR_URL as string | undefined;
  if (orchestratorUrl) {
    const eventType =
      decision === "revoked" ? "access_review.completed" : "access_review.completed";
    fetch(`${orchestratorUrl}/api/v1/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        type: eventType,
        source: "access-reviews",
        payload: {
          campaignId,
          campaignName: campaign.name,
          itemId,
          decision,
          decidedBy: user.email ?? user.userId ?? "unknown",
          scope: campaign.scope,
        },
        idempotencyKey: `ar-decision-${itemId}-${decision}-${Date.now()}`,
      }),
    }).catch(() => {}); // best-effort, non-blocking
  }

  // Check if campaign just completed (all items decided)
  const updatedCampaign = await queryPgOne<any>(
    `SELECT
       c.*,
       COUNT(i.id) AS total_items,
       SUM(CASE WHEN i.status = 'approved' THEN 1 ELSE 0 END) AS approved_items,
       SUM(CASE WHEN i.status = 'revoked'  THEN 1 ELSE 0 END) AS revoked_items
     FROM access_review_campaigns c
     LEFT JOIN access_review_items i ON i.campaign_id = c.id
     WHERE c.tenant_id = $1 AND c.id = $2
     GROUP BY c.id`,
    [tenantId, campaignId],
  );
  if (updatedCampaign?.status === "completed" && orchestratorUrl) {
    fetch(`${orchestratorUrl}/api/v1/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        type: "access_review.completed",
        source: "access-reviews",
        payload: {
          campaignId,
          campaignName: campaign.name,
          scope: campaign.scope,
          totalItems: updatedCampaign.total_items,
          approvedItems: updatedCampaign.approved_items,
          revokedItems: updatedCampaign.revoked_items,
          completedAt: updatedCampaign.completed_at,
        },
        idempotencyKey: `ar-complete-${campaignId}-${Date.now()}`,
      }),
    }).catch(() => {}); // best-effort, non-blocking
  }

  return json({ ok: true });
};
