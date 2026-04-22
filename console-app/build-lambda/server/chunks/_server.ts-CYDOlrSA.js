import { json } from '@sveltejs/kit';

function evaluateAccessReviewSuggestions(tenantCreatedAt, directoryUsers, connectedApps, campaignCount, lastCompletedAt, dismissed) {
  const suggestions = [];
  if (!tenantCreatedAt) return suggestions;
  const now = Date.now();
  const tenantAgeMs = now - new Date(tenantCreatedAt).getTime();
  const tenantAgeDays = Math.floor(tenantAgeMs / (1e3 * 60 * 60 * 24));
  const daysSinceLastReview = lastCompletedAt ? Math.floor((now - new Date(lastCompletedAt).getTime()) / (1e3 * 60 * 60 * 24)) : null;
  if (tenantAgeDays >= 30 && directoryUsers >= 5 && campaignCount === 0 && !dismissed.has("first_review")) {
    suggestions.push({
      type: "first_review",
      title: "Start your first access review",
      description: `Your organization has ${directoryUsers} users across ${connectedApps} app${connectedApps !== 1 ? "s" : ""}. An access review ensures everyone has the right permissions.`,
      priority: "high"
    });
  }
  if (campaignCount > 0 && daysSinceLastReview !== null && daysSinceLastReview >= 90 && !dismissed.has("quarterly_review")) {
    suggestions.push({
      type: "quarterly_review",
      title: "Quarterly access review due",
      description: `It's been ${daysSinceLastReview} days since your last completed review. Regular reviews are recommended for SOC 2 and ISO 27001 compliance.`,
      priority: "high"
    });
  }
  if (directoryUsers >= 50 && (daysSinceLastReview === null || daysSinceLastReview >= 60) && campaignCount > 0 && !dismissed.has("growth_review")) {
    suggestions.push({
      type: "growth_review",
      title: "Review access for growing team",
      description: `With ${directoryUsers} users, a comprehensive review helps catch stale accounts and over-provisioned access.`,
      priority: "medium"
    });
  }
  if (connectedApps >= 5 && tenantAgeDays >= 60 && (daysSinceLastReview === null || daysSinceLastReview >= 60) && campaignCount > 0 && !dismissed.has("app_expansion_review")) {
    suggestions.push({
      type: "app_expansion_review",
      title: "Review app access across your stack",
      description: `You have ${connectedApps} connected apps. An entitlement review ensures no unnecessary cross-app access.`,
      priority: "medium"
    });
  }
  return suggestions;
}
const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
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
      accessReviewSuggestions: []
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
    tenantRow,
    campaignStats,
    dismissedPref
  ] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count FROM app_credentials WHERE tenant_id = ?`).bind(tenantId).first().catch(() => ({ count: 0 })),
    db.prepare(`SELECT * FROM directory_connections WHERE tenant_id = ?`).bind(tenantId).first().catch(() => null),
    db.prepare(
      `SELECT COUNT(*) as count FROM directory_users WHERE tenant_id = ? AND status = 'active'`
    ).bind(tenantId).first().catch(() => ({ count: 0 })),
    db.prepare(`SELECT COUNT(*) as count FROM directory_groups WHERE tenant_id = ?`).bind(tenantId).first().catch(() => ({ count: 0 })),
    db.prepare(
      `SELECT COUNT(*) as count FROM group_app_mappings WHERE tenant_id = ? AND suggested = 0`
    ).bind(tenantId).first().catch(() => ({ count: 0 })),
    db.prepare(
      `SELECT COUNT(*) as count FROM group_app_mappings WHERE tenant_id = ? AND suggested = 1`
    ).bind(tenantId).first().catch(() => ({ count: 0 })),
    db.prepare(
      `SELECT actor_email, action, target_type, target_id, detail, created_at
         FROM audit_log WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5`
    ).bind(tenantId).all().then((r) => r.results || []).catch(() => []),
    db.prepare(
      `SELECT COUNT(*) as count FROM workflow_executions WHERE tenant_id = ? AND created_at > datetime('now', '-24 hours')`
    ).bind(tenantId).first().catch(() => ({ count: 0 })),
    // Compliance scores
    db.prepare(
      `SELECT framework, score, grade, controls_total, controls_implemented, controls_verified, calculated_at
         FROM compliance_scores WHERE tenant_id = ? ORDER BY framework`
    ).bind(tenantId).all().then((r) => r.results || []).catch(() => []),
    // Active automation rules
    db.prepare(`SELECT COUNT(*) as count FROM automation_rules WHERE tenant_id = ? AND enabled = 1`).bind(tenantId).first().catch(() => ({ count: 0 })),
    // Automation executions (last 24h)
    db.prepare(
      `SELECT COUNT(*) as count FROM automation_executions WHERE tenant_id = ? AND started_at > datetime('now', '-24 hours')`
    ).bind(tenantId).first().catch(() => ({ count: 0 })),
    // Evidence items
    db.prepare(`SELECT COUNT(*) as count FROM compliance_evidence WHERE tenant_id = ?`).bind(tenantId).first().catch(() => ({ count: 0 })),
    // Tenant created_at for lifecycle suggestions
    db.prepare(`SELECT created_at FROM tenants WHERE id = ?`).bind(tenantId).first().catch(() => null),
    // Access review campaign stats
    db.prepare(
      `SELECT COUNT(*) as total,
                MAX(CASE WHEN status = 'completed' THEN updated_at END) as last_completed_at
         FROM access_review_campaigns WHERE tenant_id = ?`
    ).bind(tenantId).first().catch(() => ({ total: 0, last_completed_at: null })),
    // Dismissed access review suggestions
    db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'dismissed_review_suggestions'`
    ).bind(tenantId).first().catch(() => null)
  ]);
  let dismissedSet = /* @__PURE__ */ new Set();
  try {
    const raw = dismissedPref?.value;
    if (raw) dismissedSet = new Set(JSON.parse(raw));
  } catch {
  }
  const accessReviewSuggestions = evaluateAccessReviewSuggestions(
    tenantRow?.created_at ?? null,
    activeUsers?.count ?? 0,
    appCount?.count ?? 0,
    campaignStats?.total ?? 0,
    campaignStats?.last_completed_at ?? null,
    dismissedSet
  );
  return json({
    connectedApps: appCount?.count ?? 0,
    directory: directoryConn ? {
      connected: true,
      provider: directoryConn.provider,
      status: directoryConn.status,
      lastSyncAt: directoryConn.last_sync_at,
      userCount: directoryConn.user_count,
      groupCount: directoryConn.group_count
    } : {
      connected: false,
      provider: null,
      userCount: 0,
      groupCount: 0,
      lastSyncAt: null
    },
    users: { active: activeUsers?.count ?? 0 },
    groups: { total: groupCount?.count ?? 0 },
    activeMappings: confirmedMappings?.count ?? 0,
    pendingSuggestions: pendingSuggestions?.count ?? 0,
    recentActivity: recentAudit.map((row) => ({
      action: row.action,
      description: row.detail ?? row.action,
      user: row.actor_email,
      timestamp: row.created_at,
      targetType: row.target_type,
      targetId: row.target_id
    })),
    workflows: { last24h: workflowCount?.count ?? 0 },
    compliance: {
      scores: complianceScores.map((row) => ({
        framework: row.framework,
        score: row.score,
        grade: row.grade,
        controlsTotal: row.controls_total,
        controlsImplemented: row.controls_implemented,
        controlsVerified: row.controls_verified,
        calculatedAt: row.calculated_at
      })),
      overallScore: complianceScores.length > 0 ? Math.round(
        complianceScores.reduce((sum, r) => sum + (r.score ?? 0), 0) / complianceScores.length
      ) : null,
      evidenceCount: evidenceCount?.count ?? 0
    },
    automation: {
      activeRules: automationRuleCount?.count ?? 0,
      executions24h: automationExecCount?.count ?? 0
    },
    accessReviewSuggestions
  });
};

export { GET };
//# sourceMappingURL=_server.ts-CYDOlrSA.js.map
