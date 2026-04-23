import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getCampaign, updateCampaignStatus } from "$lib/server/access-reviews";
import { writeAudit } from "$lib/server/audit";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const campaignId = params.id!;
  const campaign = await queryPgOne<any>(
    `SELECT
       c.*,
       COUNT(i.id)                                              AS total_items,
       SUM(CASE WHEN i.status = 'approved' THEN 1 ELSE 0 END) AS approved_items,
       SUM(CASE WHEN i.status = 'revoked'  THEN 1 ELSE 0 END) AS revoked_items,
       SUM(CASE WHEN i.status = 'pending'  THEN 1 ELSE 0 END) AS pending_items
     FROM access_review_campaigns c
     LEFT JOIN access_review_items i ON i.campaign_id = c.id
     WHERE c.tenant_id = $1 AND c.id = $2
     GROUP BY c.id`,
    [tenantId, campaignId],
  );
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });

  return json({ campaign });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const campaignId = params.id!;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body ?? {};
  if (status !== "active" && status !== "completed") {
    return json({ error: "status must be 'active' or 'completed'" }, { status: 400 });
  }

  const campaign = await queryPgOne<any>(
    `SELECT * FROM access_review_campaigns WHERE tenant_id = $1 AND id = $2`,
    [tenantId, campaignId],
  );
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });

  const completedAt = status === "completed" ? new Date().toISOString() : null;
  await queryPg(
    `UPDATE access_review_campaigns
     SET status = $1, updated_at = NOW(), completed_at = COALESCE($2, completed_at)
     WHERE id = $3 AND tenant_id = $4`,
    [status, completedAt, campaignId, tenantId],
  );

  await queryPg(
    `INSERT INTO audit_log (id, tenant_id, actor_id, action, resource_type, resource_id, details, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      crypto.randomUUID(),
      tenantId,
      user.userId ?? "unknown",
      "access_review_campaign.status_changed",
      "access_review_campaign",
      campaignId,
      JSON.stringify({
        actorEmail: user.email ?? "unknown",
        detail: JSON.stringify({ from: campaign.status, to: status }),
      }),
    ],
  );

  const updated = await queryPgOne<any>(
    `SELECT
       c.*,
       COUNT(i.id)                                              AS total_items,
       SUM(CASE WHEN i.status = 'approved' THEN 1 ELSE 0 END) AS approved_items,
       SUM(CASE WHEN i.status = 'revoked'  THEN 1 ELSE 0 END) AS revoked_items,
       SUM(CASE WHEN i.status = 'pending'  THEN 1 ELSE 0 END) AS pending_items
     FROM access_review_campaigns c
     LEFT JOIN access_review_items i ON i.campaign_id = c.id
     WHERE c.tenant_id = $1 AND c.id = $2
     GROUP BY c.id`,
    [tenantId, campaignId],
  );
  return json({ campaign: updated });
};
