import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { g as getWorkerBase, a as getEnv, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import '@sveltejs/kit';
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

const POST = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { id } = params;
  try {
    const upstream = `${base}/api/v1/incidents/${id}/resolve`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId
      }
    });
    const data = await res.json();
    if (res.ok) {
      const db = platform?.env?.ATLAS_SHARED_DB;
      if (db) {
        try {
          await writeAudit(db, {
            tenantId,
            actorUserId: user.userId ?? "unknown",
            actorEmail: user.email ?? "unknown",
            action: "incident.resolved",
            targetType: "incident",
            targetId: id
          });
        } catch {
        }
        try {
          const { notify } = await import('./notifications-COLEq-wV.js');
          await notify(db, platform, {
            tenantId,
            type: "incident_resolved",
            title: `Incident resolved`,
            body: `Incident ${id} was resolved by ${user.email}`,
            severity: "info",
            sourceType: "incident",
            sourceId: id,
            actionUrl: `/console/incidents`
          });
        } catch {
        }
      }
    }
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ error: "Incidents service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-Bkhu0rVC.js.map
