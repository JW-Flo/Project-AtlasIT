import { json } from '@sveltejs/kit';
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

const ACCESS_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
const GET = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const status = url.searchParams.get("status") ?? "pending";
  const { results } = await db.prepare(
    `SELECT id, requester_name, requester_email, requester_company, reason, status, created_at, reviewed_at, expires_at
       FROM trust_access_requests
       WHERE tenant_id = ? AND status = ?
       ORDER BY created_at DESC
       LIMIT 50`
  ).bind(tenantId, status).all();
  return json({ requests: results ?? [] });
};
const PATCH = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!requestId || !["approve", "deny"].includes(action)) {
    return json({ error: "requestId and action (approve|deny) are required" }, { status: 400 });
  }
  const existing = await db.prepare(`SELECT id, status FROM trust_access_requests WHERE id = ? AND tenant_id = ? LIMIT 1`).bind(requestId, tenantId).first();
  if (!existing) return json({ error: "Request not found" }, { status: 404 });
  if (existing.status !== "pending") {
    return json({ error: "Request already processed" }, { status: 409 });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (action === "approve") {
    const accessToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString();
    await db.prepare(
      `UPDATE trust_access_requests
         SET status = 'approved', access_token = ?, expires_at = ?, reviewed_at = ?, reviewed_by = ?
         WHERE id = ?`
    ).bind(accessToken, expiresAt, now, user.email ?? "unknown", requestId).run();
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "trust_access_request.approved",
      targetType: "trust_access_request",
      targetId: requestId,
      detail: JSON.stringify({ expiresAt })
    });
    return json({ status: "approved", accessToken, expiresAt });
  } else {
    await db.prepare(
      `UPDATE trust_access_requests
         SET status = 'denied', reviewed_at = ?, reviewed_by = ?
         WHERE id = ?`
    ).bind(now, user.email ?? "unknown", requestId).run();
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "trust_access_request.denied",
      targetType: "trust_access_request",
      targetId: requestId
    });
    return json({ status: "denied" });
  }
};

export { GET, PATCH };
//# sourceMappingURL=_server.ts-CKQQkXst.js.map
