import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { buildCopilotContext } from "@atlasit/shared";

interface AuditChecklistItem {
  id: string;
  category: "evidence" | "policy" | "control" | "access_review" | "remediation" | "adapter";
  title: string;
  description: string;
  status: "complete" | "incomplete" | "warning";
  /** Specific controls this item covers */
  controls?: string[];
  href: string;
}

interface AuditPrepResponse {
  framework: string;
  readinessScore: number;
  totalItems: number;
  completeItems: number;
  checklist: AuditChecklistItem[];
  generatedAt: string;
}

/**
 * GET /api/copilot/audit-prep?framework=SOC2 — returns audit readiness checklist
 * for a specific framework based on live tenant data.
 */
export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const framework = url.searchParams.get("framework") || "SOC2";

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const ctx = await buildCopilotContext(db, tenantId);

  // Load control statuses for this framework
  let controls: Array<{ id: string; name: string; framework: string; status: string }> = [];
  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'",
      )
      .bind(tenantId)
      .first<{ value: string }>();
    if (row?.value) {
      const all = JSON.parse(row.value) as Array<Record<string, string>>;
      controls = all
        .filter(
          (c) =>
            (c.framework || "").toUpperCase().replace(/[^A-Z0-9]/g, "") ===
            framework.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        )
        .map((c) => ({
          id: c.id,
          name: c.name || c.id,
          framework: c.framework,
          status: c.status || "not_started",
        }));
    }
  } catch {
    /* continue without controls */
  }

  // Load evidence counts per control for this framework
  let evidenceCounts: Record<string, number> = {};
  try {
    const { results } = await db
      .prepare(
        `SELECT control_id, COUNT(*) as cnt FROM compliance_evidence
         WHERE tenant_id = ? AND framework = ?
         GROUP BY control_id`,
      )
      .bind(tenantId, framework)
      .all<{ control_id: string; cnt: number }>();
    for (const r of results ?? []) {
      evidenceCounts[r.control_id] = r.cnt;
    }
  } catch {
    /* continue */
  }

  // Load approved policies
  let policyCount = 0;
  try {
    const row = await db
      .prepare("SELECT COUNT(*) as cnt FROM policies WHERE tenant_id = ? AND status = 'approved'")
      .bind(tenantId)
      .first<{ cnt: number }>();
    policyCount = row?.cnt ?? 0;
  } catch {
    /* continue */
  }

  // Load access review status
  let lastAccessReview: string | null = null;
  try {
    const row = await db
      .prepare(
        `SELECT MAX(created_at) as last_review FROM access_review_campaigns
         WHERE tenant_id = ? AND status = 'completed'`,
      )
      .bind(tenantId)
      .first<{ last_review: string | null }>();
    lastAccessReview = row?.last_review ?? null;
  } catch {
    /* continue */
  }

  const checklist: AuditChecklistItem[] = [];
  let id = 0;

  // 1. Control implementation status
  const notStarted = controls.filter((c) => c.status === "not_started");
  const inProgress = controls.filter((c) => c.status === "in_progress");
  const implemented = controls.filter((c) => c.status === "implemented" || c.status === "verified");

  if (notStarted.length > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "control",
      title: `${notStarted.length} controls not started`,
      description: `Controls with no activity: ${notStarted
        .slice(0, 5)
        .map((c) => c.id)
        .join(", ")}${notStarted.length > 5 ? "..." : ""}`,
      status: "incomplete",
      controls: notStarted.map((c) => c.id),
      href: "/console/compliance",
    });
  }

  if (inProgress.length > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "control",
      title: `${inProgress.length} controls in progress`,
      description:
        "These controls have some evidence but aren't fully implemented. Add more evidence or attestations.",
      status: "warning",
      controls: inProgress.map((c) => c.id),
      href: "/console/compliance",
    });
  }

  if (implemented.length > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "control",
      title: `${implemented.length} controls implemented/verified`,
      description: "These controls are audit-ready.",
      status: "complete",
      href: "/console/compliance",
    });
  }

  // 2. Evidence freshness
  const controlsWithoutEvidence = controls.filter((c) => !evidenceCounts[c.id]);
  if (controlsWithoutEvidence.length > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "evidence",
      title: `${controlsWithoutEvidence.length} controls have no evidence`,
      description: `Missing evidence for: ${controlsWithoutEvidence
        .slice(0, 5)
        .map((c) => c.id)
        .join(", ")}${controlsWithoutEvidence.length > 5 ? "..." : ""}`,
      status: "incomplete",
      controls: controlsWithoutEvidence.map((c) => c.id),
      href: "/console/compliance/feed",
    });
  }

  if (ctx.evidenceStats.staleCount > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "evidence",
      title: `${ctx.evidenceStats.staleCount} evidence items are stale (>30 days)`,
      description:
        "Auditors expect recent evidence. Trigger evidence re-collection for these controls.",
      status: "warning",
      href: "/console/compliance/feed",
    });
  }

  if (ctx.evidenceStats.recentCount > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "evidence",
      title: `${ctx.evidenceStats.totalItems} evidence items collected (${ctx.evidenceStats.recentCount} in last 24h)`,
      description: "Evidence pipeline is active.",
      status: "complete",
      href: "/console/compliance/feed",
    });
  }

  // 3. Policy coverage
  if (policyCount === 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "policy",
      title: "No approved policies",
      description:
        "Every compliance framework requires documented policies. Generate and approve policies before audit.",
      status: "incomplete",
      href: "/console/policies",
    });
  } else {
    const requiredMin = framework === "SOC2" ? 5 : framework === "ISO27001" ? 5 : 3;
    checklist.push({
      id: `audit-${++id}`,
      category: "policy",
      title: `${policyCount} approved polic${policyCount === 1 ? "y" : "ies"}`,
      description:
        policyCount >= requiredMin
          ? "Policy coverage looks sufficient."
          : `Consider generating more policies. ${framework} typically requires at least ${requiredMin}.`,
      status: policyCount >= requiredMin ? "complete" : "warning",
      href: "/console/policies",
    });
  }

  // 4. Access reviews
  if (!lastAccessReview) {
    checklist.push({
      id: `audit-${++id}`,
      category: "access_review",
      title: "No completed access reviews",
      description:
        "Periodic access reviews are required by most frameworks. Start your first review campaign.",
      status: "incomplete",
      href: "/console/access-reviews",
    });
  } else {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastAccessReview).getTime()) / (1000 * 60 * 60 * 24),
    );
    checklist.push({
      id: `audit-${++id}`,
      category: "access_review",
      title: `Last access review completed ${daysSince} day${daysSince !== 1 ? "s" : ""} ago`,
      description:
        daysSince > 90
          ? "Access reviews should be conducted quarterly. Start a new review."
          : "Access review is recent and audit-ready.",
      status: daysSince > 90 ? "warning" : "complete",
      href: "/console/access-reviews",
    });
  }

  // 5. Remediation plans
  if (ctx.remediationStats.overdue > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "remediation",
      title: `${ctx.remediationStats.overdue} overdue remediation plans`,
      description: "Auditors will flag overdue items. Update due dates or mark resolved.",
      status: "incomplete",
      href: "/console/compliance",
    });
  } else if (ctx.remediationStats.open > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "remediation",
      title: `${ctx.remediationStats.open} open remediation plans`,
      description: "Track these to completion before audit.",
      status: "warning",
      href: "/console/compliance",
    });
  } else {
    checklist.push({
      id: `audit-${++id}`,
      category: "remediation",
      title: "No overdue remediation plans",
      description: "Remediation is on track.",
      status: "complete",
      href: "/console/compliance",
    });
  }

  // 6. Adapter health
  const healthyAdapters = ctx.adapterHealth.filter((a) => !a.error);
  const unhealthyAdapters = ctx.adapterHealth.filter((a) => a.error);
  if (unhealthyAdapters.length > 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "adapter",
      title: `${unhealthyAdapters.length} integration${unhealthyAdapters.length > 1 ? "s" : ""} failing`,
      description: `Fix before audit: ${unhealthyAdapters.map((a) => a.slug).join(", ")}`,
      status: "incomplete",
      href: "/console/apps",
    });
  }
  if (ctx.connectedApps.length === 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "adapter",
      title: "No applications connected",
      description: "Connect integrations to enable automated evidence collection.",
      status: "incomplete",
      href: "/console/marketplace",
    });
  } else if (unhealthyAdapters.length === 0) {
    checklist.push({
      id: `audit-${++id}`,
      category: "adapter",
      title: `${ctx.connectedApps.length} application${ctx.connectedApps.length > 1 ? "s" : ""} connected and healthy`,
      description: "All integrations operational.",
      status: "complete",
      href: "/console/apps",
    });
  }

  const completeItems = checklist.filter((c) => c.status === "complete").length;
  const readinessScore =
    checklist.length > 0 ? Math.round((completeItems / checklist.length) * 100) : 0;

  const response: AuditPrepResponse = {
    framework,
    readinessScore,
    totalItems: checklist.length,
    completeItems,
    checklist,
    generatedAt: new Date().toISOString(),
  };

  return json(response);
};
