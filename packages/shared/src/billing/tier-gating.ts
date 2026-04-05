import type { BillingPlan } from "./types";
import { PLANS } from "./plans";

export interface GatingResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: BillingPlan;
  currentUsage?: number;
  limit?: number;
}

export function checkUserLimit(plan: BillingPlan, currentUsers: number): GatingResult {
  const limit = PLANS[plan].limits.users;
  if (limit === null) return { allowed: true };
  if (currentUsers >= limit) {
    return {
      allowed: false,
      reason: `Your ${PLANS[plan].name} plan supports up to ${limit} users`,
      upgradeRequired: getNextTier(plan),
      currentUsage: currentUsers,
      limit,
    };
  }
  return { allowed: true, currentUsage: currentUsers, limit };
}

export function checkAdapterLimit(plan: BillingPlan, currentAdapters: number): GatingResult {
  const limit = PLANS[plan].limits.adapters;
  if (limit === null) return { allowed: true };
  if (currentAdapters >= limit) {
    return {
      allowed: false,
      reason: `Your ${PLANS[plan].name} plan supports up to ${limit} integrations`,
      upgradeRequired: getNextTier(plan),
      currentUsage: currentAdapters,
      limit,
    };
  }
  return { allowed: true, currentUsage: currentAdapters, limit };
}

export function checkFrameworkLimit(plan: BillingPlan, currentFrameworks: number): GatingResult {
  const limit = PLANS[plan].limits.frameworks;
  if (limit === null) return { allowed: true };
  if (currentFrameworks >= limit) {
    return {
      allowed: false,
      reason: `Your ${PLANS[plan].name} plan supports up to ${limit} compliance frameworks`,
      upgradeRequired: getNextTier(plan),
      currentUsage: currentFrameworks,
      limit,
    };
  }
  return { allowed: true, currentUsage: currentFrameworks, limit };
}

export function checkAutomationLimit(plan: BillingPlan, currentRules: number): GatingResult {
  const limit = PLANS[plan].limits.automationRules;
  if (limit === null) return { allowed: true };
  if (currentRules >= limit) {
    return {
      allowed: false,
      reason: `Your ${PLANS[plan].name} plan supports up to ${limit} automation rules`,
      upgradeRequired: getNextTier(plan),
      currentUsage: currentRules,
      limit,
    };
  }
  return { allowed: true, currentUsage: currentRules, limit };
}

export function checkFeatureAccess(plan: BillingPlan, feature: FeatureKey): GatingResult {
  const tierLevel = TIER_LEVELS[plan];
  const requiredLevel = FEATURE_REQUIREMENTS[feature];
  if (tierLevel >= requiredLevel) return { allowed: true };
  const requiredPlan = Object.entries(TIER_LEVELS).find(
    ([, level]) => level === requiredLevel,
  )?.[0] as BillingPlan;
  return {
    allowed: false,
    reason: `${FEATURE_LABELS[feature]} requires the ${PLANS[requiredPlan].name} plan`,
    upgradeRequired: requiredPlan,
  };
}

export type FeatureKey =
  | "sso"
  | "access_reviews"
  | "nhi_governance"
  | "custom_compliance_packs"
  | "plugin_api"
  | "audit_reports"
  | "trend_analytics"
  | "benchmark_comparison"
  | "custom_branding"
  | "api_access"
  | "jml_automation"
  | "discovery";

const TIER_LEVELS: Record<BillingPlan, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

const FEATURE_REQUIREMENTS: Record<FeatureKey, number> = {
  discovery: 0,
  api_access: 1,
  jml_automation: 1,
  custom_branding: 1,
  sso: 2,
  access_reviews: 2,
  nhi_governance: 2,
  audit_reports: 2,
  trend_analytics: 2,
  benchmark_comparison: 2,
  custom_compliance_packs: 2,
  plugin_api: 3,
};

const FEATURE_LABELS: Record<FeatureKey, string> = {
  sso: "Single Sign-On",
  access_reviews: "Access Reviews",
  nhi_governance: "NHI Governance",
  custom_compliance_packs: "Custom Compliance Packs",
  plugin_api: "Plugin API",
  audit_reports: "Audit-Ready Reports",
  trend_analytics: "Trend Analytics",
  benchmark_comparison: "Benchmark Comparison",
  custom_branding: "Custom Branding",
  api_access: "API Access",
  jml_automation: "JML Automation",
  discovery: "SaaS Discovery",
};

function getNextTier(current: BillingPlan): BillingPlan {
  const order: BillingPlan[] = ["free", "starter", "professional", "enterprise"];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : current;
}
