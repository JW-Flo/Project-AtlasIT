import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { s as saveCredentials } from './credentials-CkBYNzQv.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { gateAdapterInstall } from './tier-gate-z6sllkz2.js';
import './gap-analyzer-CVZTZ0l9.js';
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

const POST = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required" }, { status: 403 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (db) {
    const tierGate = await gateAdapterInstall(db, tenantId, !!user.superAdmin);
    if (tierGate) return tierGate;
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const appId = body.appId;
  if (!appId) {
    return new Response(JSON.stringify({ error: "appId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const credentials = body.credentials || {};
  const result = await saveCredentials(platform, appId, credentials, tenantId);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error || "Failed to save credentials" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (db) {
    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: user.email ?? "unknown",
        action: "app.connected",
        targetType: "app",
        targetId: appId
      });
    } catch {
    }
  }
  if (db) {
    try {
      const { notify } = await import('./notifications-COLEq-wV.js');
      await notify(db, platform, {
        tenantId,
        type: "app_connected",
        title: `App connected: ${appId}`,
        body: `${appId} was connected by ${user.email}`,
        severity: "info",
        sourceType: "app",
        sourceId: appId,
        sourceLabel: appId,
        actionUrl: `/console/directory`
      });
    } catch {
    }
  }
  return new Response(JSON.stringify({ success: true, connected: true, id: appId }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export { POST };
//# sourceMappingURL=_server.ts-CdHd4Ktw.js.map
