/** Billing types for Phase 16 subscription management */

export type BillingPlan = "free" | "starter" | "professional" | "enterprise";
export type BillingCycle = "monthly" | "annual";
export type BillingStatus = "active" | "past_due" | "canceled" | "trialing";
export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

export interface TenantBilling {
  tenantId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingEmail: string | null;
  plan: BillingPlan;
  billingCycle: BillingCycle;
  status: BillingStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  tenantId: string;
  metric: UsageMetric;
  quantity: number;
  recordedAt: string;
  periodStart: string;
  periodEnd: string;
}

export type UsageMetric =
  | "active_users"
  | "adapters_connected"
  | "compliance_frameworks"
  | "automation_executions"
  | "evidence_collected"
  | "api_calls";

export interface Invoice {
  id: string;
  tenantId: string;
  stripeInvoiceId: string | null;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface BillingPortalSession {
  url: string;
}

export interface UsageSummary {
  metric: UsageMetric;
  current: number;
  limit: number | null;
  percentUsed: number | null;
}
