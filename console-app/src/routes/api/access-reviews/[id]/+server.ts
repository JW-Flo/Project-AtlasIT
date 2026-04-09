import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getCampaign, updateCampaignStatus } from "$lib/server/access-reviews";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const campaignId = params.id!;
  const campaign = await getCampaign(db, tenantId, campaignId);
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });

  return json({ campaign });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

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

  const campaign = await getCampaign(db, tenantId, campaignId);
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });

  await updateCampaignStatus(db, tenantId, campaignId, status);

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? "unknown",
    actorEmail: user.email ?? "unknown",
    action: "access_review_campaign.status_changed",
    targetType: "access_review_campaign",
    targetId: campaignId,
    detail: JSON.stringify({ from: campaign.status, to: status }),
  });

  const updated = await getCampaign(db, tenantId, campaignId);
  return json({ campaign: updated });
};
