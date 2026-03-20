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

async function readSettings(db: any, tenantId: string): Promise<TrustSettings> {
  const rows = await db
    .prepare(
      `SELECT key, value FROM tenant_preferences
       WHERE tenant_id = ? AND key IN ('trust_center_public', 'trust_center_visible_frameworks')`,
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

  return {
    isPublic: map["trust_center_public"] === "true",
    visibleFrameworks,
  };
}

async function upsertPref(
  db: any,
  tenantId: string,
  key: string,
  value: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, ?, ?)
       ON CONFLICT(tenant_id, key) DO UPDATE SET value = excluded.value`,
    )
    .bind(tenantId, key, value)
    .run();
}

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const settings = await readSettings(db, tenantId);
  return json({ settings });
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

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
