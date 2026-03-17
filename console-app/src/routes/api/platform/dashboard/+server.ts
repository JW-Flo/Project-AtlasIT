import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireSuperAdmin } from "$lib/server/guards";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;

  if (!db) {
    return json({
      tenants: { total: 0, active: 0, disabled: 0 },
      users: { total: 0 },
      recentTenants: [],
      recentActivity: [],
      workflows: { total: 0 },
    });
  }

  const [tenantStats, userStats, recentTenants, recentAudit, workflowStats] =
    await Promise.all([
      db
        .prepare(
          `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled
        FROM tenants`,
        )
        .first()
        .catch(() => ({ total: 0, active: 0, disabled: 0 })),
      db
        .prepare(`SELECT COUNT(*) as total FROM console_users`)
        .first()
        .catch(() => ({ total: 0 })),
      db
        .prepare(
          `SELECT t.id, t.name, t.owner_email, t.status, t.created_at,
          (SELECT COUNT(*) FROM console_users WHERE tenant_id = t.id) as user_count
        FROM tenants t ORDER BY t.created_at DESC LIMIT 10`,
        )
        .all()
        .then((r: any) => r.results || [])
        .catch(() => []),
      db
        .prepare(
          `SELECT actor_email, action, target_type, created_at
        FROM audit_log ORDER BY created_at DESC LIMIT 10`,
        )
        .all()
        .then((r: any) => r.results || [])
        .catch(() => []),
      db
        .prepare(
          `SELECT COUNT(*) as total FROM workflow_executions WHERE created_at > datetime('now', '-24 hours')`,
        )
        .first()
        .catch(() => ({ total: 0 })),
    ]);

  return json({
    tenants: {
      total: tenantStats?.total ?? 0,
      active: tenantStats?.active ?? 0,
      disabled: tenantStats?.disabled ?? 0,
    },
    users: { total: userStats?.total ?? 0 },
    recentTenants: (recentTenants as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      ownerEmail: row.owner_email,
      status: row.status,
      createdAt: row.created_at,
      userCount: row.user_count,
    })),
    recentActivity: (recentAudit as any[]).map((row: any) => ({
      action: row.action,
      description: row.action,
      tenant: row.actor_email,
      timestamp: row.created_at,
      targetType: row.target_type,
    })),
    workflows: { total: workflowStats?.total ?? 0 },
  });
};
