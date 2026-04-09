import type { RequestHandler } from "@sveltejs/kit";

const DEFAULT_POLICY = {
  enabled: true,
  autoJoiner: true,
  autoLeaver: true,
  autoMover: true,
  leaverGraceMs: 0,
  notifyManager: true,
  notifyUser: false,
  requireJoinerApproval: false,
};

/** GET — fetch JML policy for tenant */
export const GET: RequestHandler = async ({ platform, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();

  const db = getSharedDb(platform);
  if (!db) return json({ policy: DEFAULT_POLICY });

  try {
    await ensureTable(db);

    const row = await db
      .prepare("SELECT * FROM jml_policies WHERE tenant_id = ?")
      .bind(user.tenantId)
      .first();

    const policy = row
      ? {
          enabled: !!row.enabled,
          autoJoiner: !!row.auto_joiner,
          autoLeaver: !!row.auto_leaver,
          autoMover: !!row.auto_mover,
          leaverGraceMs: row.leaver_grace_ms ?? 0,
          notifyManager: !!row.notify_manager,
          notifyUser: !!row.notify_user,
          requireJoinerApproval: !!row.require_joiner_approval,
        }
      : DEFAULT_POLICY;

    return json({ policy });
  } catch (e) {
    console.error("JML policy GET error:", e);
    // Return defaults so UI is always usable
    return json({ policy: DEFAULT_POLICY });
  }
};

/** PUT — update JML policy */
export const PUT: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();

  const db = getSharedDb(platform);
  if (!db) return json({ error: "Database unavailable" }, 503);

  try {
    await ensureTable(db);

    const body = await request.json();

    await db
      .prepare(
        `INSERT INTO jml_policies (tenant_id, enabled, auto_joiner, auto_leaver, auto_mover, leaver_grace_ms, notify_manager, notify_user, require_joiner_approval, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT (tenant_id) DO UPDATE SET
           enabled = excluded.enabled,
           auto_joiner = excluded.auto_joiner,
           auto_leaver = excluded.auto_leaver,
           auto_mover = excluded.auto_mover,
           leaver_grace_ms = excluded.leaver_grace_ms,
           notify_manager = excluded.notify_manager,
           notify_user = excluded.notify_user,
           require_joiner_approval = excluded.require_joiner_approval,
           updated_at = datetime('now')`,
      )
      .bind(
        user.tenantId,
        body.enabled ? 1 : 0,
        body.autoJoiner ? 1 : 0,
        body.autoLeaver ? 1 : 0,
        body.autoMover ? 1 : 0,
        body.leaverGraceMs ?? 0,
        body.notifyManager ? 1 : 0,
        body.notifyUser ? 1 : 0,
        body.requireJoinerApproval ? 1 : 0,
      )
      .run();

    return json({ updated: true });
  } catch (e) {
    console.error("JML policy PUT error:", e);
    return json({ error: "Failed to save JML policy" }, 500);
  }
};

// H-7 FIX: Table created via migration 0018_jml_policies.sql
async function ensureTable(_db: any): Promise<void> {
  // No-op — table managed by migrations
}

function getSharedDb(platform: any): any {
  const env = (platform?.env as any) || {};
  return env.DB ?? env.ATLAS_SHARED_DB ?? null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unauthorized() {
  return json({ error: "Unauthorized" }, 401);
}
