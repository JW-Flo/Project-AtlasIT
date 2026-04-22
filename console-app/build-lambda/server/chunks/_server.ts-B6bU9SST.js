import { json } from '@sveltejs/kit';
import './gap-analyzer-CVZTZ0l9.js';
import { b as buildCopilotContext } from './context-builder-4573Ue-F.js';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required. Please log out and log back in." }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ actions: [] });
  const ctx = await buildCopilotContext(db, tenantId);
  const actions = buildPrioritizedActions(ctx);
  return json({ actions, generatedAt: (/* @__PURE__ */ new Date()).toISOString() });
};
function buildPrioritizedActions(ctx) {
  const actions = [];
  let id = 0;
  if (ctx.remediationStats.overdue > 0) {
    actions.push({
      id: `action-${++id}`,
      priority: 100,
      category: "remediation",
      title: `${ctx.remediationStats.overdue} overdue remediation plan${ctx.remediationStats.overdue > 1 ? "s" : ""}`,
      description: "Overdue items will be flagged by auditors. Resolve or update due dates immediately.",
      impact: "critical",
      href: "/console/compliance",
      scoreImpact: ctx.remediationStats.overdue * 2
    });
  }
  if (ctx.openIncidents > 0) {
    actions.push({
      id: `action-${++id}`,
      priority: 95,
      category: "incident",
      title: `${ctx.openIncidents} open incident${ctx.openIncidents > 1 ? "s" : ""} need attention`,
      description: "Unresolved incidents affect your incident response compliance controls.",
      impact: "critical",
      href: "/console/incidents"
    });
  }
  const unhealthy = ctx.adapterHealth.filter((a) => a.error);
  if (unhealthy.length > 0) {
    actions.push({
      id: `action-${++id}`,
      priority: 90,
      category: "adapter",
      title: `${unhealthy.length} adapter${unhealthy.length > 1 ? "s" : ""} failing: ${unhealthy.map((a) => a.slug).join(", ")}`,
      description: "Broken integrations stop evidence collection and will cause score regression.",
      impact: "high",
      href: "/console/apps"
    });
  }
  if (ctx.evidenceStats.staleCount > 10) {
    const pct = ctx.evidenceStats.totalItems > 0 ? Math.round(ctx.evidenceStats.staleCount / ctx.evidenceStats.totalItems * 100) : 0;
    actions.push({
      id: `action-${++id}`,
      priority: 85,
      category: "evidence",
      title: `${pct}% of evidence is stale (${ctx.evidenceStats.staleCount} items >30 days)`,
      description: "Auditors expect recent evidence. Trigger a manual evidence collection or check adapter health.",
      impact: "high",
      href: "/console/compliance/feed",
      scoreImpact: Math.min(15, Math.round(pct / 5))
    });
  }
  for (const [framework, score] of Object.entries(ctx.complianceScores)) {
    if (score < 50) {
      actions.push({
        id: `action-${++id}`,
        priority: 80,
        category: "control",
        title: `${framework} score is ${score}% — needs immediate attention`,
        description: `Focus on the lowest-scoring controls in ${framework} to improve your posture.`,
        impact: "high",
        href: "/console/compliance",
        scoreImpact: Math.round((50 - score) / 2)
      });
    } else if (score < 70) {
      actions.push({
        id: `action-${++id}`,
        priority: 60,
        category: "control",
        title: `${framework} score is ${score}% — room for improvement`,
        description: `Review in-progress controls in ${framework} and add missing evidence.`,
        impact: "medium",
        href: "/console/compliance",
        scoreImpact: Math.round((70 - score) / 3)
      });
    }
  }
  if (ctx.policyCount === 0 && ctx.selectedFrameworks.length > 0) {
    actions.push({
      id: `action-${++id}`,
      priority: 75,
      category: "policy",
      title: "No policies generated yet",
      description: "Compliance frameworks require documented policies. Generate your first policy with AI assistance.",
      impact: "high",
      href: "/console/policies"
    });
  }
  if (ctx.automationRuleCount === 0) {
    actions.push({
      id: `action-${++id}`,
      priority: 65,
      category: "control",
      title: "No automation rules configured",
      description: "Automation rules generate compliance evidence automatically. Start with JML lifecycle rules.",
      impact: "medium",
      href: "/console/automation"
    });
  }
  if (ctx.connectedApps.length === 0) {
    actions.push({
      id: `action-${++id}`,
      priority: 70,
      category: "adapter",
      title: "Connect your first application",
      description: "Integrations are the foundation of evidence collection. Connect your identity provider first.",
      impact: "high",
      href: "/console/marketplace"
    });
  }
  const criticalInsights = ctx.recentInsights.filter(
    (i) => i.severity === "critical" || i.severity === "high"
  );
  if (criticalInsights.length > 0) {
    actions.push({
      id: `action-${++id}`,
      priority: 88,
      category: "control",
      title: `${criticalInsights.length} high-priority compliance insight${criticalInsights.length > 1 ? "s" : ""}`,
      description: "Review gaps and drift alerts that could affect your audit readiness.",
      impact: "high",
      href: "/console/insights"
    });
  }
  if (ctx.evidenceStats.recentCount === 0 && ctx.connectedApps.length > 0) {
    actions.push({
      id: `action-${++id}`,
      priority: 82,
      category: "evidence",
      title: "No evidence collected in the last 24 hours",
      description: "Evidence collection may have stopped. Check adapter health and cron job status.",
      impact: "high",
      href: "/console/platform-status"
    });
  }
  actions.sort((a, b) => b.priority - a.priority);
  return actions;
}

export { GET };
//# sourceMappingURL=_server.ts-B6bU9SST.js.map
