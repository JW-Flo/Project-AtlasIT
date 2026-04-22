import { json } from '@sveltejs/kit';

const PLANS = {
  free: {
    id: "free",
    name: "Free",
    tagline: "SaaS discovery & compliance assessment",
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    minimumMonthlyCents: 0,
    cta: "Get started free",
    features: [
      "SaaS discovery & shadow IT detection",
      "Compliance assessment for 1 framework",
      "Up to 10 users",
      "3 app integrations",
      "Community support",
      "7-day evidence retention"
    ],
    limits: {
      users: 10,
      adapters: 3,
      frameworks: 1,
      automationRules: 5,
      evidenceRetentionDays: 7,
      apiCallsPerDay: 1e3,
      customCompliancePacks: false,
      ssoIncluded: false,
      supportLevel: "community"
    }
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "IT ops automation for growing teams",
    monthlyPriceCents: 400,
    annualPriceCents: 3600,
    minimumMonthlyCents: 2e3,
    cta: "Start 30-day free trial",
    features: [
      "Everything in Free",
      "Up to 50 users",
      "10 app integrations",
      "JML automation & provisioning",
      "2 compliance frameworks",
      "30-day evidence retention",
      "Email support"
    ],
    limits: {
      users: 50,
      adapters: 10,
      frameworks: 2,
      automationRules: 25,
      evidenceRetentionDays: 30,
      apiCallsPerDay: 1e4,
      customCompliancePacks: false,
      ssoIncluded: false,
      supportLevel: "email"
    }
  },
  professional: {
    id: "professional",
    name: "Professional",
    tagline: "Full compliance & governance platform",
    monthlyPriceCents: 600,
    annualPriceCents: 6e3,
    minimumMonthlyCents: 3e3,
    highlighted: true,
    cta: "Start 14-day free trial",
    features: [
      "Everything in Starter",
      "Up to 500 users",
      "Unlimited integrations",
      "All compliance frameworks",
      "Custom automation rules",
      "Access reviews & NHI governance",
      "1-year evidence retention",
      "SSO included",
      "Priority support",
      "Audit-ready reports"
    ],
    limits: {
      users: 500,
      adapters: null,
      frameworks: null,
      automationRules: null,
      evidenceRetentionDays: 365,
      apiCallsPerDay: 1e5,
      customCompliancePacks: true,
      ssoIncluded: true,
      supportLevel: "priority"
    }
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom deployment & dedicated support",
    monthlyPriceCents: 0,
    // custom pricing
    annualPriceCents: 0,
    minimumMonthlyCents: 0,
    cta: "Contact sales",
    features: [
      "Everything in Professional",
      "Unlimited users",
      "Unlimited everything",
      "Custom compliance packs",
      "Plugin API access",
      "Dedicated account manager",
      "99.99% SLA",
      "Custom integrations",
      "On-premise deployment option",
      "Dedicated support"
    ],
    limits: {
      users: null,
      adapters: null,
      frameworks: null,
      automationRules: null,
      evidenceRetentionDays: 730,
      apiCallsPerDay: null,
      customCompliancePacks: true,
      ssoIncluded: true,
      supportLevel: "dedicated"
    }
  }
};
function checkUserLimit(plan, currentUsers) {
  const limit = PLANS[plan].limits.users;
  if (limit === null)
    return { allowed: true };
  if (currentUsers >= limit) {
    return {
      allowed: false,
      reason: `Your ${PLANS[plan].name} plan supports up to ${limit} users`,
      upgradeRequired: getNextTier(plan),
      currentUsage: currentUsers,
      limit
    };
  }
  return { allowed: true, currentUsage: currentUsers, limit };
}
function checkAdapterLimit(plan, currentAdapters) {
  const limit = PLANS[plan].limits.adapters;
  if (limit === null)
    return { allowed: true };
  if (currentAdapters >= limit) {
    return {
      allowed: false,
      reason: `Your ${PLANS[plan].name} plan supports up to ${limit} integrations`,
      upgradeRequired: getNextTier(plan),
      currentUsage: currentAdapters,
      limit
    };
  }
  return { allowed: true, currentUsage: currentAdapters, limit };
}
function checkFrameworkLimit(plan, currentFrameworks) {
  const limit = PLANS[plan].limits.frameworks;
  if (limit === null)
    return { allowed: true };
  if (currentFrameworks >= limit) {
    return {
      allowed: false,
      reason: `Your ${PLANS[plan].name} plan supports up to ${limit} compliance frameworks`,
      upgradeRequired: getNextTier(plan),
      currentUsage: currentFrameworks,
      limit
    };
  }
  return { allowed: true, currentUsage: currentFrameworks, limit };
}
function checkFeatureAccess(plan, feature) {
  const tierLevel = TIER_LEVELS[plan];
  const requiredLevel = FEATURE_REQUIREMENTS[feature];
  if (tierLevel >= requiredLevel)
    return { allowed: true };
  const requiredPlan = Object.entries(TIER_LEVELS).find(([, level]) => level === requiredLevel)?.[0];
  return {
    allowed: false,
    reason: `${FEATURE_LABELS[feature]} requires the ${PLANS[requiredPlan].name} plan`,
    upgradeRequired: requiredPlan
  };
}
const TIER_LEVELS = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3
};
const FEATURE_REQUIREMENTS = {
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
  plugin_api: 3
};
const FEATURE_LABELS = {
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
  discovery: "SaaS Discovery"
};
function getNextTier(current) {
  const order = ["free", "starter", "professional", "enterprise"];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : current;
}
async function getTenantPlan(db, tenantId) {
  try {
    const row = await db.prepare("SELECT plan FROM tenant_billing WHERE tenant_id = ?").bind(tenantId).first();
    if (row?.plan) return row.plan;
  } catch {
  }
  try {
    const row = await db.prepare("SELECT tier FROM tenants WHERE id = ?").bind(tenantId).first();
    if (row?.tier) return row.tier;
  } catch {
  }
  return "free";
}
async function getTenantUsage(db, tenantId) {
  const counts = { users: 0, adapters: 0, frameworks: 0, automationRules: 0 };
  try {
    const [usersRow, adaptersRow, frameworksRow, rulesRow] = await db.batch([
      db.prepare("SELECT COUNT(*) as cnt FROM console_user_roles WHERE tenant_id = ?").bind(tenantId),
      db.prepare("SELECT COUNT(*) as cnt FROM app_credentials WHERE tenant_id = ?").bind(tenantId),
      db.prepare("SELECT COUNT(*) as cnt FROM tenant_compliance_packs WHERE tenant_id = ?").bind(tenantId),
      db.prepare("SELECT COUNT(*) as cnt FROM automation_rules WHERE tenant_id = ?").bind(tenantId)
    ]);
    counts.users = usersRow.results?.[0]?.cnt ?? 0;
    counts.adapters = adaptersRow.results?.[0]?.cnt ?? 0;
    counts.frameworks = frameworksRow.results?.[0]?.cnt ?? 0;
    counts.automationRules = rulesRow.results?.[0]?.cnt ?? 0;
  } catch {
  }
  return counts;
}
function gateResponse(result) {
  return json(
    {
      error: result.reason,
      code: "TIER_LIMIT_EXCEEDED",
      upgradeRequired: result.upgradeRequired,
      currentUsage: result.currentUsage,
      limit: result.limit
    },
    { status: 403 }
  );
}
async function gateUserInvite(db, tenantId, isSuperAdmin) {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const usage = await getTenantUsage(db, tenantId);
  const result = checkUserLimit(plan, usage.users);
  return result.allowed ? null : gateResponse(result);
}
async function gateAdapterInstall(db, tenantId, isSuperAdmin) {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const usage = await getTenantUsage(db, tenantId);
  const result = checkAdapterLimit(plan, usage.adapters);
  return result.allowed ? null : gateResponse(result);
}
async function gateFrameworkAdd(db, tenantId, isSuperAdmin) {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const usage = await getTenantUsage(db, tenantId);
  const result = checkFrameworkLimit(plan, usage.frameworks);
  return result.allowed ? null : gateResponse(result);
}
async function gateFeature(db, tenantId, feature, isSuperAdmin) {
  if (isSuperAdmin) return null;
  const plan = await getTenantPlan(db, tenantId);
  const result = checkFeatureAccess(plan, feature);
  return result.allowed ? null : gateResponse(result);
}

export { gateAdapterInstall, gateFeature, gateFrameworkAdd, gateUserInvite, getTenantPlan, getTenantUsage };
//# sourceMappingURL=tier-gate-z6sllkz2.js.map
