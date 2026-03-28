import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface JourneyStep {
  name: string;
  completed: boolean;
  evidence: string;
}

/**
 * GET /api/platform/journey-metrics
 * Measures completion rate of the core user journey:
 *   login → dashboard → connect app → create workflow/rule → see evidence
 *
 * Returns per-tenant progress through the key activation funnel.
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const steps: JourneyStep[] = [];

  // Step 1: Login (always true if we got here)
  steps.push({ name: "login", completed: true, evidence: "authenticated session" });

  // Step 2: Dashboard visited (tenant exists)
  const tenant = await db
    .prepare("SELECT id FROM tenants WHERE id = ? LIMIT 1")
    .bind(tenantId)
    .first();
  steps.push({
    name: "dashboard",
    completed: !!tenant,
    evidence: tenant ? "tenant provisioned" : "no tenant record",
  });

  // Step 3: Connect at least one app
  const connectedApp = await db
    .prepare(
      "SELECT COUNT(*) as cnt FROM group_app_mappings WHERE tenant_id = ?",
    )
    .bind(tenantId)
    .first<{ cnt: number }>();
  const hasConnectedApp = (connectedApp?.cnt ?? 0) > 0;
  steps.push({
    name: "connect_app",
    completed: hasConnectedApp,
    evidence: hasConnectedApp
      ? `${connectedApp!.cnt} app mapping(s)`
      : "no app mappings configured",
  });

  // Step 4: Create at least one automation rule or workflow
  const ruleCount = await db
    .prepare(
      "SELECT COUNT(*) as cnt FROM automation_rules WHERE tenant_id = ?",
    )
    .bind(tenantId)
    .first<{ cnt: number }>();
  const hasRule = (ruleCount?.cnt ?? 0) > 0;
  steps.push({
    name: "create_automation",
    completed: hasRule,
    evidence: hasRule
      ? `${ruleCount!.cnt} automation rule(s)`
      : "no automation rules",
  });

  // Step 5: Evidence generated
  const evidenceCount = await db
    .prepare(
      "SELECT COUNT(*) as cnt FROM compliance_evidence WHERE tenant_id = ?",
    )
    .bind(tenantId)
    .first<{ cnt: number }>();
  const hasEvidence = (evidenceCount?.cnt ?? 0) > 0;
  steps.push({
    name: "see_evidence",
    completed: hasEvidence,
    evidence: hasEvidence
      ? `${evidenceCount!.cnt} evidence item(s)`
      : "no evidence collected",
  });

  const completedSteps = steps.filter((s) => s.completed).length;
  const completionRate = Math.round((completedSteps / steps.length) * 100);

  return json({
    tenantId,
    steps,
    completedSteps,
    totalSteps: steps.length,
    completionRate,
    fullyActivated: completedSteps === steps.length,
    checkedAt: new Date().toISOString(),
  });
};
