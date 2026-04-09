/**
 * Trust Center settings — controls what's publicly visible.
 *
 * GET  → current settings for authenticated tenant
 * PATCH → update settings
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

interface TrustSettings {
  isPublic: boolean;
  visibleFrameworks: string[];
}

interface ControlVisibility {
  [controlId: string]: "public" | "nda" | "private";
}

interface ExtendedTrustSettings extends TrustSettings {
  controlVisibility: ControlVisibility;
}

async function readSettings(db: any, tenantId: string): Promise<ExtendedTrustSettings> {
  const rows = await db
    .prepare(
      `SELECT key, value FROM tenant_preferences
       WHERE tenant_id = ? AND key IN ('trust_center_public', 'trust_center_visible_frameworks', 'trust_center_control_visibility')`,
    )
    .bind(tenantId)
    .all<{ key: string; value: string }>();

  const map: Record<string, string> = {};
  for (const r of rows.results ?? []) map[r.key] = r.value;

  let visibleFrameworks: string[] = [];
  try {
    if (map["trust_center_visible_frameworks"]) {
      visibleFrameworks = JSON.parse(map["trust_center_visible_frameworks"]);
    }
  } catch {
    // use empty default
  }

  let controlVisibility: ControlVisibility = {};
  try {
    if (map["trust_center_control_visibility"]) {
      controlVisibility = JSON.parse(map["trust_center_control_visibility"]);
    }
  } catch {
    // use empty default
  }

  return {
    isPublic: map["trust_center_public"] === "true",
    visibleFrameworks,
    controlVisibility,
  };
}

async function upsertPref(db: any, tenantId: string, key: string, value: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, ?, ?)
       ON CONFLICT(tenant_id, key) DO UPDATE SET value = excluded.value`,
    )
    .bind(tenantId, key, value)
    .run();
}

async function resolveTenantId(db: any, user: any): Promise<string | null> {
  if (user.tenantId) return user.tenantId;
  // Fallback: look up tenant from console_users or console_user_roles
  try {
    const row = await db
      .prepare(
        "SELECT tenant_id FROM console_user_roles WHERE email = ? LIMIT 1",
      )
      .bind(user.email)
      .first<{ tenant_id: string }>();
    if (row?.tenant_id) return row.tenant_id;
  } catch { /* ignore */ }
  try {
    const row = await db
      .prepare(
        "SELECT tenant_id FROM console_users WHERE email = ? LIMIT 1",
      )
      .bind(user.email)
      .first<{ tenant_id: string }>();
    if (row?.tenant_id) return row.tenant_id;
  } catch { /* ignore */ }
  // Last resort: single-tenant fallback
  try {
    const row = await db
      .prepare("SELECT id FROM tenants LIMIT 1")
      .first<{ id: string }>();
    if (row?.id) return row.id;
  } catch { /* ignore */ }
  return null;
}

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const tenantId = await resolveTenantId(db, user);
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const settings = await readSettings(db, tenantId);
  return json({ settings });
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const tenantId = await resolveTenantId(db, user);
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: string[] = [];

  if (typeof body.isPublic === "boolean") {
    await upsertPref(db, tenantId, "trust_center_public", String(body.isPublic));
    updates.push("isPublic");
  }

  if (Array.isArray(body.visibleFrameworks)) {
    await upsertPref(
      db,
      tenantId,
      "trust_center_visible_frameworks",
      JSON.stringify(body.visibleFrameworks),
    );
    updates.push("visibleFrameworks");
  }

  if (body.controlVisibility && typeof body.controlVisibility === "object") {
    // Validate: only allow "public" | "nda" | "private" values
    const validValues = new Set(["public", "nda", "private"]);
    const cleaned: Record<string, string> = {};
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
    detail: JSON.stringify({ updated: updates }),
  });

  const settings = await readSettings(db, tenantId);
  return json({ settings });
};
