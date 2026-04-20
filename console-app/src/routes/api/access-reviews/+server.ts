import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listCampaignsPg, createCampaignPg } from "$lib/server/access-reviews";
import { writeAuditPg } from "$lib/server/audit";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  try {
    const campaigns = await listCampaignsPg(tenantId);
    return json({ campaigns });
  } catch (e) {
    console.error("List campaigns error:", e);
    return json({ error: "Failed to load campaigns" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
    return json({ error: "name is required" }, { status: 400 });
  }

  try {
    const campaign = await createCampaignPg(tenantId, {
      name: body.name.trim(),
      scope: body.scope,
      reviewerPolicy: body.reviewerPolicy,
      dueDate: body.dueDate ?? null,
      gracePeriodDays: body.gracePeriodDays,
      createdBy: user.email,
    });

    // Non-blocking audit
    try {
      await writeAuditPg({
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: user.email ?? "unknown",
        action: "access_review.campaign_created",
        targetType: "access_review_campaign",
        targetId: campaign.id,
        detail: JSON.stringify({ name: campaign.name, scope: campaign.scope }),
      });
    } catch {
      // Non-fatal: audit failure should not break campaign creation
    }

    return json({ campaign }, { status: 201 });
  } catch (e) {
    console.error("Create campaign error:", e);
    return json({ error: "Failed to create campaign" }, { status: 500 });
  }
};
