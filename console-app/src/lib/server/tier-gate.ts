/**
 * Server-side tier gating helper.
 * Loads tenant plan from DB and checks limits before allowing actions.
 */
import { json } from "@sveltejs/kit";
import type { BillingPlan } from "@atlasit/shared/billing/types";
import {
  checkUserLimit,
  checkAdapterLimit,
  checkFrameworkLimit,
  checkAutomationLimit,
  checkFeatureAccess,
  type GatingResult,
  type FeatureKey,
} from "@atlasit/shared/billing/tier-gating";

export async function getTenantPlan(db: D1Database, tenantId: string): Promise<BillingPlan> {
  try {
    const row = await db
      .prepare("SELECT plan FROM tenant_billing WHERE tenant_id = ?")
      .bind(tenantId)
      .first<{ plan: string }>();
    if (row?.plan) return row.plan as BillingPlan;
  } catch {
    // table may not exist yet
  }
  // Fallback to tenants.tier
  try {
    const row = await db
      .prepare("SELECT tier FROM tenants WHERE id = ?")
      .bind(tenantId)
      .first<{ tier: string }>();
    if (row?.tier) return row.tier as BillingPlan;
  } catch {
    // fallback
  }
  return "free";
}

export async function getTenantUsage(
  db: D1Database,
  tenantId: string,
): Promise<{ users: number; adapters: number; frameworks: number; automationRules: number }> {
  const counts = { users: 0, adapters: 0, frameworks: 0, automationRules: 0 };
  try {
    const [usersRow, adaptersRow, frameworksRow, rulesRow] = await db.batch([
      db
        .prepare("SELECT COUNT(*) as cnt FROM console_user_roles WHERE tenant_id = ?")
        .bind(tenantId),
      db.prepare("SELECT COUNT(*) as cnt FROM app_credentials WHERE tenant_id = ?").bind(tenantId),
      db
        .prepare("SELECT COUNT(*) as cnt FROM tenant_compliance_packs WHERE tenant_id = ?")
        .bind(tenantId),
      db.prepare("SELECT COUNT(*) as cnt FROM automation_rules WHERE tenant_id = ?").bind(tenantId),
    ]);
    counts.users = (usersRow.results?.[0] as any)?.cnt ?? 0;
    counts.adapters = (adaptersRow.results?.[0] as any)?.cnt ?? 0;
    counts.frameworks = (frameworksRow.results?.[0] as any)?.cnt ?? 0;
    counts.automationRules = (rulesRow.results?.[0] as any)?.cnt ?? 0;
  } catch {
    // Some tables may not exist; return 0s
  }
  return counts;
}

function gateResponse(result: GatingResult) {
  return json(
    {
      error: result.reason,
      code: "TIER_LIMIT_EXCEEDED",
      upgradeRequired: result.upgradeRequired,
      currentUsage: result.currentUsage,
      limit: result.limit,
    },
    { status: 403 },
  );
}

/**
 * Check if tenant can add another user. Returns null if allowed, or a Response if blocked.
 */
export async function gateUserInvite(
  db: D1Database,
  tenantId: string,
  isSuperAdmin: boolean,
): Promise<Response | null> {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const usage = await getTenantUsage(db, tenantId);
  const result = checkUserLimit(plan, usage.users);
  return result.allowed ? null : gateResponse(result);
}

/**
 * Check if tenant can connect another adapter/integration.
 */
export async function gateAdapterInstall(
  db: D1Database,
  tenantId: string,
  isSuperAdmin: boolean,
): Promise<Response | null> {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const usage = await getTenantUsage(db, tenantId);
  const result = checkAdapterLimit(plan, usage.adapters);
  return result.allowed ? null : gateResponse(result);
}

/**
 * Check if tenant can add another compliance framework.
 */
export async function gateFrameworkAdd(
  db: D1Database,
  tenantId: string,
  isSuperAdmin: boolean,
): Promise<Response | null> {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const usage = await getTenantUsage(db, tenantId);
  const result = checkFrameworkLimit(plan, usage.frameworks);
  return result.allowed ? null : gateResponse(result);
}

/**
 * Check if tenant can create another automation rule.
 */
export async function gateAutomationRule(
  db: D1Database,
  tenantId: string,
  isSuperAdmin: boolean,
): Promise<Response | null> {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const usage = await getTenantUsage(db, tenantId);
  const result = checkAutomationLimit(plan, usage.automationRules);
  return result.allowed ? null : gateResponse(result);
}

/**
 * Check if tenant has access to a specific feature.
 */
export async function gateFeature(
  db: D1Database,
  tenantId: string,
  feature: FeatureKey,
  isSuperAdmin: boolean,
): Promise<Response | null> {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const result = checkFeatureAccess(plan, feature);
  return result.allowed ? null : gateResponse(result);
}
