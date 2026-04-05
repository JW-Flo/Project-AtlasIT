import type { BillingPlan } from "./types";

export interface PlanDefinition {
  id: BillingPlan;
  name: string;
  tagline: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  /** Minimum monthly charge (in cents) regardless of user count */
  minimumMonthlyCents: number;
  features: string[];
  limits: PlanLimits;
  highlighted?: boolean;
  cta: string;
}

export interface PlanLimits {
  users: number | null;
  adapters: number | null;
  frameworks: number | null;
  automationRules: number | null;
  evidenceRetentionDays: number;
  apiCallsPerDay: number | null;
  customCompliancePacks: boolean;
  ssoIncluded: boolean;
  supportLevel: "community" | "email" | "priority" | "dedicated";
}

export const PLANS: Record<BillingPlan, PlanDefinition> = {
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
      "7-day evidence retention",
    ],
    limits: {
      users: 10,
      adapters: 3,
      frameworks: 1,
      automationRules: 5,
      evidenceRetentionDays: 7,
      apiCallsPerDay: 1000,
      customCompliancePacks: false,
      ssoIncluded: false,
      supportLevel: "community",
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "IT ops automation for growing teams",
    monthlyPriceCents: 400,
    annualPriceCents: 3600,
    minimumMonthlyCents: 2000,
    cta: "Start 30-day free trial",
    features: [
      "Everything in Free",
      "Up to 50 users",
      "10 app integrations",
      "JML automation & provisioning",
      "2 compliance frameworks",
      "30-day evidence retention",
      "Email support",
    ],
    limits: {
      users: 50,
      adapters: 10,
      frameworks: 2,
      automationRules: 25,
      evidenceRetentionDays: 30,
      apiCallsPerDay: 10000,
      customCompliancePacks: false,
      ssoIncluded: false,
      supportLevel: "email",
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    tagline: "Full compliance & governance platform",
    monthlyPriceCents: 600,
    annualPriceCents: 6000,
    minimumMonthlyCents: 3000,
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
      "Audit-ready reports",
    ],
    limits: {
      users: 500,
      adapters: null,
      frameworks: null,
      automationRules: null,
      evidenceRetentionDays: 365,
      apiCallsPerDay: 100000,
      customCompliancePacks: true,
      ssoIncluded: true,
      supportLevel: "priority",
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom deployment & dedicated support",
    monthlyPriceCents: 0, // custom pricing
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
      "Dedicated support",
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
      supportLevel: "dedicated",
    },
  },
};

export function getPlan(plan: BillingPlan): PlanDefinition {
  return PLANS[plan];
}

export function formatPrice(cents: number, cycle: "monthly" | "annual" = "monthly"): string {
  if (cents === 0) return "Free";
  const dollars = cents / 100;
  return `$${dollars}`;
}

export function getAnnualSavingsPercent(plan: BillingPlan): number {
  const def = PLANS[plan];
  if (def.monthlyPriceCents === 0) return 0;
  const monthlyAnnualized = def.monthlyPriceCents * 12;
  return Math.round(((monthlyAnnualized - def.annualPriceCents) / monthlyAnnualized) * 100);
}
