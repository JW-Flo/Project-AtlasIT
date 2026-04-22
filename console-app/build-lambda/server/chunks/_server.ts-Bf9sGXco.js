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

const GET = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  try {
    const pack = await db.prepare("SELECT * FROM compliance_packs WHERE id = ?").bind(params.id).first();
    if (!pack) return json({ error: "Pack not found" }, { status: 404 });
    const controlsResult = await db.prepare("SELECT * FROM compliance_pack_controls WHERE pack_id = ? ORDER BY sort_order ASC").bind(params.id).all();
    const controls = controlsResult.results ?? [];
    const installation = await db.prepare("SELECT * FROM tenant_compliance_packs WHERE tenant_id = ? AND pack_id = ?").bind(user.tenantId, params.id).first();
    return json({
      pack: {
        ...pack,
        is_builtin: pack.is_builtin === 1,
        installed: installation !== null,
        installedAt: installation?.installed_at ?? null
      },
      controls
    });
  } catch (e) {
    console.error("Compliance pack load error:", e);
    return json({ error: "Failed to load compliance pack" }, { status: 500 });
  }
};
const PUT = async ({ params, request, locals, platform }) => {
  const user = locals.user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const existing = await db.prepare("SELECT * FROM compliance_packs WHERE id = ?").bind(params.id).first();
  if (!existing) return json({ error: "Pack not found" }, { status: 404 });
  if (existing.is_builtin === 1 && !user.superAdmin) {
    return json({ error: "Built-in packs cannot be modified" }, { status: 403 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { name, description, status } = body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updates = [];
  const bindings = [];
  if (name !== void 0) {
    updates.push("name = ?");
    bindings.push(name);
  }
  if (description !== void 0) {
    updates.push("description = ?");
    bindings.push(description);
  }
  if (status !== void 0) {
    const validStatuses = ["draft", "published", "deprecated"];
    if (!validStatuses.includes(status)) {
      return json({ error: "Invalid status value" }, { status: 400 });
    }
    updates.push("status = ?");
    bindings.push(status);
  }
  if (updates.length === 0) {
    return json({ error: "No updatable fields provided" }, { status: 400 });
  }
  updates.push("updated_at = ?");
  bindings.push(now);
  bindings.push(params.id);
  await db.prepare(`UPDATE compliance_packs SET ${updates.join(", ")} WHERE id = ?`).bind(...bindings).run();
  const pack = await db.prepare("SELECT * FROM compliance_packs WHERE id = ?").bind(params.id).first();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "compliance_pack.update",
    targetType: "compliance_pack",
    targetId: params.id,
    detail: JSON.stringify(body)
  });
  return json({ pack });
};
const DELETE = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const existing = await db.prepare("SELECT * FROM compliance_packs WHERE id = ?").bind(params.id).first();
  if (!existing) return json({ error: "Pack not found" }, { status: 404 });
  if (existing.is_builtin === 1 && !user.superAdmin) {
    return json({ error: "Built-in packs cannot be deleted" }, { status: 403 });
  }
  const installations = await db.prepare("SELECT COUNT(*) as count FROM tenant_compliance_packs WHERE pack_id = ?").bind(params.id).first();
  if ((installations?.count ?? 0) > 0) {
    return json(
      { error: "Cannot delete a pack that is installed by one or more tenants" },
      { status: 409 }
    );
  }
  await db.prepare("DELETE FROM compliance_packs WHERE id = ?").bind(params.id).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "compliance_pack.delete",
    targetType: "compliance_pack",
    targetId: params.id,
    detail: JSON.stringify({ name: existing.name })
  });
  return json({ ok: true });
};

export { DELETE, GET, PUT };
//# sourceMappingURL=_server.ts-Bf9sGXco.js.map
