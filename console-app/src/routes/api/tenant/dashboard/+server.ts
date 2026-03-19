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
    complianceScores,
    automationRuleCount,
    automationExecCount,
    evidenceCount,
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
    // Compliance scores
    db
      .prepare(
        `SELECT framework, score, grade, controls_total, controls_implemented, controls_verified, calculated_at
         FROM compliance_scores WHERE tenant_id = ? ORDER BY framework`,
      )
      .bind(tenantId)
      .all()
      .then((r: any) => r.results || [])
      .catch(() => []),
    // Active automation rules
    db
      .prepare(
        `SELECT COUNT(*) as count FROM automation_rules WHERE tenant_id = ? AND enabled = 1`,
      )
      .bind(tenantId)
      .first()
      .catch(() => ({ count: 0 })),
    // Automation executions (last 24h)
    db
      .prepare(
        `SELECT COUNT(*) as count FROM automation_executions WHERE tenant_id = ? AND started_at > datetime('now', '-24 hours')`,
      )
      .bind(tenantId)
      .first()
      .catch(() => ({ count: 0 })),
    // Evidence items
    db
      .prepare(
        `SELECT COUNT(*) as count FROM compliance_evidence WHERE tenant_id = ?`,
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
          lastSyncAt: null,
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
    compliance: {
      scores: (complianceScores as any[]).map((row: any) => ({
        framework: row.framework,
        score: row.score,
        grade: row.grade,
        controlsTotal: row.controls_total,
        controlsImplemented: row.controls_implemented,
        controlsVerified: row.controls_verified,
        calculatedAt: row.calculated_at,
      })),
      overallScore: (complianceScores as any[]).length > 0
        ? Math.round((complianceScores as any[]).reduce((sum: number, r: any) => sum + (r.score ?? 0), 0) / (complianceScores as any[]).length)
        : null,
      evidenceCount: evidenceCount?.count ?? 0,
    },
    automation: {
      activeRules: automationRuleCount?.count ?? 0,
      executions24h: automationExecCount?.count ?? 0,
    },
  });
};
