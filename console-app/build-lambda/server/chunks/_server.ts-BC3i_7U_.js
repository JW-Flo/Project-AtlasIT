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

async function readSettings(db, tenantId) {
  const rows = await db.prepare(
    `SELECT key, value FROM tenant_preferences
       WHERE tenant_id = ? AND key IN ('trust_center_public', 'trust_center_visible_frameworks', 'trust_center_control_visibility')`
  ).bind(tenantId).all();
  const map = {};
  for (const r of rows.results ?? []) map[r.key] = r.value;
  let visibleFrameworks = [];
  try {
    if (map["trust_center_visible_frameworks"]) {
      visibleFrameworks = JSON.parse(map["trust_center_visible_frameworks"]);
    }
  } catch {
  }
  let controlVisibility = {};
  try {
    if (map["trust_center_control_visibility"]) {
      controlVisibility = JSON.parse(map["trust_center_control_visibility"]);
    }
  } catch {
  }
  return {
    isPublic: map["trust_center_public"] === "true",
    visibleFrameworks,
    controlVisibility
  };
}
async function upsertPref(db, tenantId, key, value) {
  await db.prepare(
    `INSERT INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, ?, ?)
       ON CONFLICT(tenant_id, key) DO UPDATE SET value = excluded.value`
  ).bind(tenantId, key, value).run();
}
async function resolveTenantId(db, user) {
  if (user.tenantId) return user.tenantId;
  try {
    const row = await db.prepare(
      "SELECT tenant_id FROM console_user_roles WHERE email = ? LIMIT 1"
    ).bind(user.email).first();
    if (row?.tenant_id) return row.tenant_id;
  } catch {
  }
  try {
    const row = await db.prepare(
      "SELECT tenant_id FROM console_users WHERE email = ? LIMIT 1"
    ).bind(user.email).first();
    if (row?.tenant_id) return row.tenant_id;
  } catch {
  }
  try {
    const row = await db.prepare("SELECT id FROM tenants LIMIT 1").first();
    if (row?.id) return row.id;
  } catch {
  }
  return null;
}
const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const tenantId = await resolveTenantId(db, user);
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const settings = await readSettings(db, tenantId);
  return json({ settings });
};
const PATCH = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const tenantId = await resolveTenantId(db, user);
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates = [];
  if (typeof body.isPublic === "boolean") {
    await upsertPref(db, tenantId, "trust_center_public", String(body.isPublic));
    updates.push("isPublic");
  }
  if (Array.isArray(body.visibleFrameworks)) {
    await upsertPref(
      db,
      tenantId,
      "trust_center_visible_frameworks",
      JSON.stringify(body.visibleFrameworks)
    );
    updates.push("visibleFrameworks");
  }
  if (body.controlVisibility && typeof body.controlVisibility === "object") {
    const validValues = /* @__PURE__ */ new Set(["public", "nda", "private"]);
    const cleaned = {};
    for (const [key, val] of Object.entries(body.controlVisibility)) {
      if (typeof val === "string" && validValues.has(val)) {
        cleaned[key] = val;
      }
    }
    await upsertPref(db, tenantId, "trust_center_control_visibility", JSON.stringify(cleaned));
    updates.push("controlVisibility");
  }
  if (updates.length === 0) {
    return json({ error: "No valid fields provided" }, { status: 400 });
  }
  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? "unknown",
    actorEmail: user.email ?? "unknown",
    action: "trust_center_settings.updated",
    targetType: "trust_settings",
    detail: JSON.stringify({ updated: updates })
  });
  const settings = await readSettings(db, tenantId);
  return json({ settings });
};

export { GET, PATCH };
//# sourceMappingURL=_server.ts-BC3i_7U_.js.map
