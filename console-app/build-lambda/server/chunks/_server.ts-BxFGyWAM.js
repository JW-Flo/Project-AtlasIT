import { json } from '@sveltejs/kit';
import { g as getCampaign, s as submitDecision } from './access-reviews-BTht9KY_.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
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

const POST = async ({ params, request, locals, platform }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const campaignId = params.id;
  const campaign = await getCampaign(db, tenantId, campaignId);
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status === "completed" || campaign.status === "expired") {
    return json({ error: "Campaign is no longer active" }, { status: 409 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { itemId, decision, notes } = body ?? {};
  if (!itemId || !decision || !["approved", "revoked"].includes(decision)) {
    return json(
      { error: "itemId and decision ('approved' | 'revoked') are required" },
      { status: 400 }
    );
  }
  await submitDecision(db, tenantId, campaignId, {
    itemId,
    decision,
    decidedBy: user.email ?? user.userId ?? "unknown",
    notes
  });
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? "unknown",
    actorEmail: user.email ?? "unknown",
    action: `access_review.${decision}`,
    targetType: "access_review_item",
    targetId: itemId,
    detail: JSON.stringify({ campaignId, decision })
  });
  const orchestratorUrl = platform?.env?.ORCHESTRATOR_URL;
  if (orchestratorUrl) {
    const eventType = decision === "revoked" ? "access_review.completed" : "access_review.completed";
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
          scope: campaign.scope
        },
        idempotencyKey: `ar-decision-${itemId}-${decision}-${Date.now()}`
      })
    }).catch(() => {
    });
  }
  const updatedCampaign = await getCampaign(db, tenantId, campaignId);
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
          totalItems: updatedCampaign.totalItems,
          approvedItems: updatedCampaign.approvedItems,
          revokedItems: updatedCampaign.revokedItems,
          completedAt: updatedCampaign.completedAt
        },
        idempotencyKey: `ar-complete-${campaignId}-${Date.now()}`
      })
    }).catch(() => {
    });
  }
  return json({ ok: true });
};

export { POST };
//# sourceMappingURL=_server.ts-BxFGyWAM.js.map
