import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { queryPg } from "$lib/server/pg";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const billing = await queryPg<{
    tenant_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    billing_email: string | null;
    plan: string;
    billing_cycle: string;
    status: string;
    seats: number;
    trial_ends_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    canceled_at: string | null;
  }>(`SELECT * FROM tenant_billing WHERE tenant_id = $1`, [user.tenantId]);

  const row = billing[0] ?? {
    tenant_id: user.tenantId,
    plan: "free",
    billing_cycle: "monthly",
    status: "active",
    seats: 1,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    billing_email: null,
    trial_ends_at: null,
    current_period_start: null,
    current_period_end: null,
    canceled_at: null,
  };

  const invoices = await queryPg<{
    id: string;
    stripe_invoice_id: string | null;
    amount_cents: number;
    currency: string;
    status: string;
    period_start: string;
    period_end: string;
    paid_at: string | null;
    pdf_url: string | null;
    created_at: string;
  }>(`SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 24`, [
    user.tenantId,
  ]);

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const usage = await queryPg<{ metric: string; quantity: number }>(
    `SELECT metric, SUM(quantity)::int as quantity FROM usage_records
     WHERE tenant_id = $1 AND period_start >= $2 AND period_start < $3
     GROUP BY metric`,
    [user.tenantId, periodStart, periodEnd],
  );

  return json({
    status: "success",
    data: {
      billing: {
        tenantId: row.tenant_id,
        stripeCustomerId: row.stripe_customer_id,
        stripeSubscriptionId: row.stripe_subscription_id,
        billingEmail: row.billing_email,
        plan: row.plan,
        billingCycle: row.billing_cycle,
        status: row.status,
        seats: row.seats ?? 1,
        trialEndsAt: row.trial_ends_at,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        canceledAt: row.canceled_at,
      },
      invoices: invoices.map((i) => ({
        id: i.id,
        stripeInvoiceId: i.stripe_invoice_id,
        amountCents: i.amount_cents,
        currency: i.currency,
        status: i.status,
        periodStart: i.period_start,
        periodEnd: i.period_end,
        paidAt: i.paid_at,
        pdfUrl: i.pdf_url,
        createdAt: i.created_at,
      })),
      usage: usage.map((u) => ({
        metric: u.metric,
        current: u.quantity,
      })),
    },
    timestamp: new Date().toISOString(),
  });
};
