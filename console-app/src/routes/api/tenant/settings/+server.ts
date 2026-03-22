import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";
import { toCamel } from "$lib/utils/dto";
import { buildDefaultControls } from "$lib/compliance/framework-controls";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const tenant = await db
    .prepare(
      `SELECT id, name, owner_email, industry, size, created_at, status FROM tenants WHERE id = ?`,
    )
    .bind(user.tenantId)
    .first();

  if (!tenant) {
    return json({ error: "Tenant not found" }, { status: 404 });
  }

  // Fetch branding and framework preferences
  let logoUrl = "";
  let accentColor = "";
  let frameworks: string[] = [];
  try {
    const { results: rows } = await db
      .prepare(
        `SELECT key, value FROM tenant_preferences WHERE tenant_id = ? AND key IN ('logo_url', 'accent_color', 'frameworks')`,
      )
      .bind(user.tenantId)
      .all<{ key: string; value: string }>();
    for (const row of rows ?? []) {
      if (row.key === "logo_url") logoUrl = row.value;
      if (row.key === "accent_color") accentColor = row.value;
      if (row.key === "frameworks") {
        try { frameworks = JSON.parse(row.value); } catch {}
      }
    }
  } catch {}

  return json({ ...toCamel(tenant), logoUrl, accentColor, frameworks });
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { name, industry, size, logoUrl, accentColor, frameworks } = body as {
    name?: string;
    industry?: string;
    size?: string;
    logoUrl?: string;
    accentColor?: string;
    frameworks?: string[];
  };

  await db
    .prepare(
      `UPDATE tenants SET name = COALESCE(?, name), industry = COALESCE(?, industry), size = COALESCE(?, size) WHERE id = ?`,
    )
    .bind(name ?? null, industry ?? null, size ?? null, user!.tenantId)
    .run();

  // Save branding preferences
  const prefUpserts: any[] = [];
  if (logoUrl !== undefined) {
    prefUpserts.push(
      db
        .prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'logo_url', ?)`,
        )
        .bind(user!.tenantId, logoUrl),
    );
  }
  if (accentColor !== undefined) {
    prefUpserts.push(
      db
        .prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'accent_color', ?)`,
        )
        .bind(user!.tenantId, accentColor),
    );
  }
  if (frameworks !== undefined && Array.isArray(frameworks)) {
    const validFrameworks = ["SOC2", "ISO27001", "NIST CSF", "HIPAA", "GDPR"];
    const filtered = frameworks.filter((f) => validFrameworks.includes(f));
    if (filtered.length > 0) {
      prefUpserts.push(
        db
          .prepare(
            `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'frameworks', ?)`,
          )
          .bind(user!.tenantId, JSON.stringify(filtered)),
      );
      // Rebuild compliance controls to match the new framework selection.
      // Preserves existing control statuses where the control ID still exists.
      let existingControls: any[] = [];
      try {
        const row = await db
          .prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`)
          .bind(user!.tenantId)
          .first<{ value: string }>();
        if (row?.value) existingControls = JSON.parse(row.value);
      } catch {}
      const existingStatusMap = new Map(
        existingControls.map((c: any) => [c.id, { status: c.status, notes: c.notes }]),
      );
      const newControls = buildDefaultControls(filtered).map((c) => {
        const existing = existingStatusMap.get(c.id);
        return existing ? { ...c, status: existing.status, notes: existing.notes ?? "" } : c;
      });
      prefUpserts.push(
        db
          .prepare(
            `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'compliance_controls', ?)`,
          )
          .bind(user!.tenantId, JSON.stringify(newControls)),
      );
    } else {
      // Empty selection: remove the frameworks key so the fallback/warning kicks in
      prefUpserts.push(
        db
          .prepare(`DELETE FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`)
          .bind(user!.tenantId),
      );
    }
  }
  if (prefUpserts.length > 0) {
    await db.batch(prefUpserts);
  }

  await writeAudit(db, {
    tenantId: user!.tenantId!,
    actorUserId: user!.userId,
    actorEmail: user!.email,
    action: "tenant.settings_updated",
    targetType: "tenant",
    targetId: user!.tenantId,
    detail: JSON.stringify({ name, industry, size, logoUrl, accentColor, frameworks }),
  });

  return json({ success: true });
};
