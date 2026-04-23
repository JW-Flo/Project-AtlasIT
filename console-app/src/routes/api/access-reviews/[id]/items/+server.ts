import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getCampaign, listItems, createItems } from "$lib/server/access-reviews";
import { requireTenantRole } from "$lib/server/guards";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const campaignId = params.id!;
  const campaign = await queryPgOne<any>(
    `SELECT * FROM access_review_campaigns WHERE tenant_id = $1 AND id = $2`,
    [tenantId, campaignId],
  );
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });

  const items = await queryPg<any>(
    `SELECT * FROM access_review_items WHERE tenant_id = $1 AND campaign_id = $2 ORDER BY user_email, app_name`,
    [tenantId, campaignId],
  );
  return json({ campaign, items });
};

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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body?.items) || body.items.length === 0) {
    return json({ error: "items array is required" }, { status: 400 });
  }

  const created: any[] = [];
  for (const item of body.items) {
    const id = crypto.randomUUID();
    await queryPg(
      `INSERT INTO access_review_items
         (id, campaign_id, tenant_id, user_id, user_email, app_id, app_name, role, reviewer_email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
      [
        id,
        campaignId,
        tenantId,
        item.userId,
        item.userEmail ?? null,
        item.appId,
        item.appName ?? null,
        item.role ?? null,
        item.reviewerEmail ?? null,
      ],
    );
    created.push({
      id,
      campaignId,
      tenantId,
      userId: item.userId,
      userEmail: item.userEmail ?? null,
      appId: item.appId,
      appName: item.appName ?? null,
      role: item.role ?? null,
      reviewerEmail: item.reviewerEmail ?? null,
      status: "pending",
      decidedAt: null,
      decidedBy: null,
      notes: null,
    });
  }
  return json({ items: created }, { status: 201 });
};
