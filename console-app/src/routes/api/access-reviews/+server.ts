import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listCampaigns, createCampaign } from "$lib/server/access-reviews";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ campaigns: [] });

  const campaigns = await listCampaigns(db, tenantId);
  return json({ campaigns });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
    return json({ error: "name is required" }, { status: 400 });
  }

  const campaign = await createCampaign(db, tenantId, {
    name: body.name.trim(),
    scope: body.scope,
    reviewerPolicy: body.reviewerPolicy,
    dueDate: body.dueDate ?? null,
    gracePeriodDays: body.gracePeriodDays,
    createdBy: user.email,
  });

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? "unknown",
    actorEmail: user.email ?? "unknown",
    action: "access_review_campaign.created",
    targetType: "access_review_campaign",
    targetId: campaign.id,
    detail: JSON.stringify({ name: campaign.name, scope: campaign.scope }),
  });

  return json({ campaign }, { status: 201 });
};
