import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) {
    return json({
      connectedApps: 0,
      directory: null,
      users: { active: 0 },
      groups: { total: 0 },
      activeMappings: 0,
      pendingSuggestions: 0,
      recentActivity: [],
      workflows: { last24h: 0 },
    });
  }

  const [
    appCount,
    directoryConn,
    activeUsers,
    groupCount,
    confirmedMappings,
    pendingSuggestions,
    recentAudit,
    workflowCount,
  ] = await Promise.all([
    db
      .prepare(
        `SELECT COUNT(*) as count FROM app_credentials WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .first()
      .catch(() => ({ count: 0 })),
    db
      .prepare(`SELECT * FROM directory_connections WHERE tenant_id = ?`)
      .bind(tenantId)
      .first()
      .catch(() => null),
    db
      .prepare(
        `SELECT COUNT(*) as count FROM directory_users WHERE tenant_id = ? AND status = 'active'`,
      )
      .bind(tenantId)
      .first()
      .catch(() => ({ count: 0 })),
    db
      .prepare(
        `SELECT COUNT(*) as count FROM directory_groups WHERE tenant_id = ?`,
      )
      .bind(tenantId)
      .first()
      .catch(() => ({ count: 0 })),
    db
      .prepare(
        `SELECT COUNT(*) as count FROM group_app_mappings WHERE tenant_id = ? AND suggested = 0`,
      )
      .bind(tenantId)
      .first()
      .catch(() => ({ count: 0 })),
    db
      .prepare(
        `SELECT COUNT(*) as count FROM group_app_mappings WHERE tenant_id = ? AND suggested = 1`,
      )
      .bind(tenantId)
      .first()
      .catch(() => ({ count: 0 })),
    db
      .prepare(
        `SELECT actor_email, action, target_type, target_id, detail, created_at
         FROM audit_log WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5`,
      )
      .bind(tenantId)
      .all()
      .then((r: any) => r.results || [])
      .catch(() => []),
    db
      .prepare(
        `SELECT COUNT(*) as count FROM workflow_executions WHERE tenant_id = ? AND created_at > datetime('now', '-24 hours')`,
      )
      .bind(tenantId)
      .first()
      .catch(() => ({ count: 0 })),
  ]);

  return json({
    connectedApps: appCount?.count ?? 0,
    directory: directoryConn
      ? {
          connected: true,
          provider: directoryConn.provider,
          status: directoryConn.status,
          lastSyncAt: directoryConn.last_sync_at,
          userCount: directoryConn.user_count,
          groupCount: directoryConn.group_count,
        }
      : {
          connected: false,
          provider: null,
          userCount: 0,
          groupCount: 0,
          lastSync: null,
        },
    users: { active: activeUsers?.count ?? 0 },
    groups: { total: groupCount?.count ?? 0 },
    activeMappings: confirmedMappings?.count ?? 0,
    pendingSuggestions: pendingSuggestions?.count ?? 0,
    recentActivity: (recentAudit as any[]).map((row: any) => ({
      action: row.action,
      description: row.detail ?? row.action,
      user: row.actor_email,
      timestamp: row.created_at,
      targetType: row.target_type,
      targetId: row.target_id,
    })),
    workflows: { last24h: workflowCount?.count ?? 0 },
  });
};
