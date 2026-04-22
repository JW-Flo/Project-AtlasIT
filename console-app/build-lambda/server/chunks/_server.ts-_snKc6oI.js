import { json } from '@sveltejs/kit';
import { g as getCampaign, a as listItems, b as createItems } from './access-reviews-BTht9KY_.js';
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

const GET = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ items: [] });
  const campaignId = params.id;
  const campaign = await getCampaign(db, tenantId, campaignId);
  if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });
  const items = await listItems(db, tenantId, campaignId);
  return json({ campaign, items });
};
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
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body?.items) || body.items.length === 0) {
    return json({ error: "items array is required" }, { status: 400 });
  }
  const items = await createItems(db, tenantId, campaignId, { items: body.items });
  return json({ items }, { status: 201 });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-_snKc6oI.js.map
