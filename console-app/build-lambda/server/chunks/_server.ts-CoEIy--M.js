import { json } from '@sveltejs/kit';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { gateFrameworkAdd } from './tier-gate-z6sllkz2.js';
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

const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const tierGate = await gateFrameworkAdd(db, user.tenantId, !!user.superAdmin);
  if (tierGate) return tierGate;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { packId, config } = body;
  if (!packId) return json({ error: "packId is required" }, { status: 400 });
  const pack = await db.prepare("SELECT * FROM compliance_packs WHERE id = ? AND status = 'published'").bind(packId).first();
  if (!pack) return json({ error: "Pack not found or not published" }, { status: 404 });
  const existing = await db.prepare("SELECT id FROM tenant_compliance_packs WHERE tenant_id = ? AND pack_id = ?").bind(user.tenantId, packId).first();
  if (existing) {
    return json({ error: "Pack already installed" }, { status: 409 });
  }
  const installId = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO tenant_compliance_packs (id, tenant_id, pack_id, installed_at, config)
       VALUES (?, ?, ?, ?, ?)`
  ).bind(installId, user.tenantId, packId, now, config ? JSON.stringify(config) : null).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "compliance_pack.install",
    targetType: "compliance_pack",
    targetId: packId,
    detail: JSON.stringify({ packName: pack.name, packSlug: pack.slug })
  });
  return json({ ok: true, installId }, { status: 201 });
};
const DELETE = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { packId } = body;
  if (!packId) return json({ error: "packId is required" }, { status: 400 });
  const installation = await db.prepare(
    "SELECT tcp.id, cp.name, cp.slug FROM tenant_compliance_packs tcp JOIN compliance_packs cp ON cp.id = tcp.pack_id WHERE tcp.tenant_id = ? AND tcp.pack_id = ?"
  ).bind(user.tenantId, packId).first();
  if (!installation) {
    return json({ error: "Pack not installed" }, { status: 404 });
  }
  await db.prepare("DELETE FROM tenant_compliance_packs WHERE tenant_id = ? AND pack_id = ?").bind(user.tenantId, packId).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "compliance_pack.uninstall",
    targetType: "compliance_pack",
    targetId: packId,
    detail: JSON.stringify({ packName: installation.name, packSlug: installation.slug })
  });
  return json({ ok: true });
};

export { DELETE, POST };
//# sourceMappingURL=_server.ts-CoEIy--M.js.map
