import { g as getWorkerBase, a as getEnv, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
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

const GET = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const upstream = `${base}/api/v1/access-requests${url.search}`;
  try {
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId
      }
    });
    const data = await res.json();
    if (Array.isArray(data.items)) {
      data.items = data.items.map((row) => ({
        id: row.id,
        subject: row.subject_ref ?? row.subject,
        resource: row.resource,
        status: row.status,
        reason: row.reason ?? row.justification,
        createdAt: row.created_at ?? row.createdAt,
        decidedAt: row.decided_at ?? row.decidedAt ?? null,
        approver: row.approved_by ?? row.approver ?? null
      }));
    }
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Access requests service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
};
const POST = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    const json = await request.json();
    body = JSON.stringify(json);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const upstream = `${base}/api/v1/access-requests`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId
      },
      body
    });
    const rawData = await res.json();
    const data = rawData?.request ? {
      ...rawData,
      request: {
        id: rawData.request.id,
        subject: rawData.request.subject_ref ?? rawData.request.subject,
        resource: rawData.request.resource,
        status: rawData.request.status,
        reason: rawData.request.reason ?? rawData.request.justification,
        createdAt: rawData.request.created_at ?? rawData.request.createdAt,
        decidedAt: rawData.request.decided_at ?? rawData.request.decidedAt ?? null,
        approver: rawData.request.approved_by ?? rawData.request.approver ?? null
      }
    } : rawData;
    if (res.ok) {
      const db = platform?.env?.ATLAS_SHARED_DB;
      if (db) {
        try {
          await writeAudit(db, {
            tenantId,
            actorUserId: user.userId ?? "unknown",
            actorEmail: user.email ?? "unknown",
            action: "access_request.created",
            targetType: "access_request",
            targetId: data?.request?.id ?? data?.id,
            detail: data?.request?.resource ? JSON.stringify({ resource: data.request.resource }) : void 0
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
    return new Response(
      JSON.stringify({ error: "Access requests service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
};

export { GET, POST };
//# sourceMappingURL=_server.ts-C0k-2M4a.js.map
