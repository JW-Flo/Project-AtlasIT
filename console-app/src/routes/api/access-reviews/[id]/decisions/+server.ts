import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getCampaign, submitDecision } from "$lib/server/access-reviews";
import { writeAudit } from "$lib/server/audit";

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const campaignId = params.id!;
  const campaign = await getCampaign(db, tenantId, campaignId);
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

  await submitDecision(db, tenantId, campaignId, {
    itemId,
    decision,
    decidedBy: user.email ?? user.userId ?? "unknown",
    notes,
  });

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? "unknown",
    actorEmail: user.email ?? "unknown",
    action: `access_review.${decision}`,
    targetType: "access_review_item",
    targetId: itemId,
    detail: JSON.stringify({ campaignId, decision }),
  });

  return json({ ok: true });
};
