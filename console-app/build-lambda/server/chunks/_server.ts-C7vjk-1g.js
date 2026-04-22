import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
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

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ provider: null }, { status: 200 });
  const row = await db.prepare(`SELECT provider, status FROM directory_connections WHERE tenant_id = ? LIMIT 1`).bind(tenantId).first();
  return json({ provider: row?.provider ?? null, status: row?.status ?? null });
};
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, { status: 400 });
  }
  const { provider, domain } = body;
  const validProviders = ["okta", "google_workspace", "microsoft_365"];
  if (!provider || !validProviders.includes(provider)) {
    return json({ error: "invalid provider" }, { status: 400 });
  }
  const connectionId = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO directory_connections (id, tenant_id, provider, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?)
       ON CONFLICT(tenant_id) DO UPDATE SET provider = excluded.provider, status = 'pending', updated_at = excluded.updated_at`
  ).bind(connectionId, tenantId, provider, now, now).run();
  if (provider === "okta" && domain) {
    const credId = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO app_credentials (id, tenant_id, app_id, credentials, created_at, updated_at)
         VALUES (?, ?, 'okta', ?, ?, ?)
         ON CONFLICT(tenant_id, app_id) DO UPDATE SET credentials = excluded.credentials, updated_at = excluded.updated_at`
    ).bind(credId, tenantId, JSON.stringify({ domain }), now, now).run();
  }
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "directory.connect",
    targetType: "directory_connection",
    targetId: connectionId,
    detail: JSON.stringify({ provider, domain })
  });
  const row = await db.prepare(`SELECT id FROM directory_connections WHERE tenant_id = ?`).bind(tenantId).first();
  return json({ success: true, connectionId: row?.id ?? connectionId });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-C7vjk-1g.js.map
