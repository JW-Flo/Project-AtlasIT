import { json } from '@sveltejs/kit';
import { l as listCampaignsPg, c as createCampaignPg } from './access-reviews-BTht9KY_.js';
import { a as writeAuditPg } from './audit-DeKPFK-8.js';
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
import './gap-analyzer-CVZTZ0l9.js';

const GET = async ({ locals }) => {
  const user = locals.user;
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
const POST = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  let body;
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
      createdBy: user.email
    });
    try {
      await writeAuditPg({
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: user.email ?? "unknown",
        action: "access_review.campaign_created",
        targetType: "access_review_campaign",
        targetId: campaign.id,
        detail: JSON.stringify({ name: campaign.name, scope: campaign.scope })
      });
    } catch {
    }
    return json({ campaign }, { status: 201 });
  } catch (e) {
    console.error("Create campaign error:", e);
    return json({ error: "Failed to create campaign" }, { status: 500 });
  }
};

export { GET, POST };
//# sourceMappingURL=_server.ts-B6Hf9hTN.js.map
