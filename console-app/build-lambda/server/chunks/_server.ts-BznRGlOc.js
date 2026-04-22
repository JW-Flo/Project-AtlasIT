import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { t as toCamel } from './dto-qzAL3BiV.js';
import { b as buildDefaultControls } from './framework-controls-w9ucJmdS.js';
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
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  try {
    const tenant = await db.prepare(
      `SELECT id, name, owner_email, industry, size, created_at, status FROM tenants WHERE id = ?`
    ).bind(user.tenantId).first();
    if (!tenant) {
      return json({ error: "Tenant not found" }, { status: 404 });
    }
    let logoUrl = "";
    let accentColor = "";
    let frameworks = [];
    try {
      const { results: rows } = await db.prepare(
        `SELECT key, value FROM tenant_preferences WHERE tenant_id = ? AND key IN ('logo_url', 'accent_color', 'frameworks')`
      ).bind(user.tenantId).all();
      for (const row of rows ?? []) {
        if (row.key === "logo_url") logoUrl = row.value;
        if (row.key === "accent_color") accentColor = row.value;
        if (row.key === "frameworks") {
          try {
            frameworks = JSON.parse(row.value);
          } catch {
          }
        }
      }
    } catch {
    }
    return json({ ...toCamel(tenant), logoUrl, accentColor, frameworks });
  } catch (e) {
    console.error("Tenant settings load error:", e);
    return json({ error: "Failed to load tenant settings" }, { status: 500 });
  }
};
const PATCH = async ({ request, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const { name, industry, size, logoUrl, accentColor, frameworks } = body;
  await db.prepare(
    `UPDATE tenants SET name = COALESCE(?, name), industry = COALESCE(?, industry), size = COALESCE(?, size) WHERE id = ?`
  ).bind(name ?? null, industry ?? null, size ?? null, user.tenantId).run();
  const prefUpserts = [];
  if (logoUrl !== void 0) {
    prefUpserts.push(
      db.prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'logo_url', ?)`
      ).bind(user.tenantId, logoUrl)
    );
  }
  if (accentColor !== void 0) {
    const safeColor = /^#[0-9a-fA-F]{3,8}$|^rgb[a]?\([^)]+\)$|^hsl[a]?\([^)]+\)$|^[a-zA-Z]{2,30}$/.test(
      (accentColor ?? "").trim()
    ) ? accentColor.trim() : "";
    prefUpserts.push(
      db.prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'accent_color', ?)`
      ).bind(user.tenantId, safeColor)
    );
  }
  if (frameworks !== void 0 && Array.isArray(frameworks)) {
    const validFrameworks = ["SOC2", "ISO27001", "NIST CSF", "HIPAA", "GDPR"];
    const filtered = frameworks.filter((f) => validFrameworks.includes(f));
    if (filtered.length > 0) {
      prefUpserts.push(
        db.prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'frameworks', ?)`
        ).bind(user.tenantId, JSON.stringify(filtered))
      );
      let existingControls = [];
      try {
        const row = await db.prepare(
          `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`
        ).bind(user.tenantId).first();
        if (row?.value) existingControls = JSON.parse(row.value);
      } catch {
      }
      const existingStatusMap = new Map(
        existingControls.map((c) => [c.id, { status: c.status, notes: c.notes }])
      );
      const newControls = buildDefaultControls(filtered).map((c) => {
        const existing = existingStatusMap.get(c.id);
        return existing ? { ...c, status: existing.status, notes: existing.notes ?? "" } : c;
      });
      prefUpserts.push(
        db.prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'compliance_controls', ?)`
        ).bind(user.tenantId, JSON.stringify(newControls))
      );
    } else {
      prefUpserts.push(
        db.prepare(`DELETE FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`).bind(user.tenantId)
      );
    }
  }
  if (prefUpserts.length > 0) {
    await db.batch(prefUpserts);
  }
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "tenant.settings_updated",
    targetType: "tenant",
    targetId: user.tenantId,
    detail: JSON.stringify({ name, industry, size, logoUrl, accentColor, frameworks })
  });
  return json({ success: true });
};

export { GET, PATCH };
//# sourceMappingURL=_server.ts-BznRGlOc.js.map
