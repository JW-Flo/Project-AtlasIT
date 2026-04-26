import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { queryPg, queryPgOne } from "$lib/server/pg";
import { getStripe } from "$lib/server/stripe";
import { PLANS } from "@atlasit/shared/billing/plans";
import type { BillingPlan, BillingCycle } from "@atlasit/shared/billing/types";

const VALID_PLANS: BillingPlan[] = ["starter", "professional"];
const VALID_CYCLES: BillingCycle[] = ["monthly", "annual"];

export const POST: RequestHandler = async ({ request, locals, url }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, { status: 400 });

  const plan = body.plan as BillingPlan;
  const cycle = (body.cycle || "monthly") as BillingCycle;

  if (!VALID_PLANS.includes(plan)) {
    return json({ error: "Invalid plan. Choose starter or professional." }, { status: 400 });
  }
  if (!VALID_CYCLES.includes(cycle)) {
    return json({ error: "Invalid cycle. Choose monthly or annual." }, { status: 400 });
  }

  const planDef = PLANS[plan];
  const priceId = planDef.stripePriceIds?.[cycle];
  if (!priceId) {
    return json({ error: "Pricing not configured for this plan/cycle" }, { status: 501 });
  }

  const stripe = getStripe();

  const billing = await queryPgOne<{
    stripe_customer_id: string | null;
    billing_email: string | null;
    seats: number;
  }>(
    `SELECT stripe_customer_id, billing_email, COALESCE(seats, 1) as seats FROM tenant_billing WHERE tenant_id = $1`,
    [user.tenantId],
  );

  let customerId = billing?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: billing?.billing_email || user.email,
      metadata: { tenant_id: user.tenantId },
    });
    customerId = customer.id;

    await queryPg(
      `INSERT INTO tenant_billing (tenant_id, stripe_customer_id, billing_email, plan, billing_cycle, status, seats, created_at, updated_at)
       VALUES ($1, $2, $3, 'free', 'monthly', 'active', 1, NOW(), NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET stripe_customer_id = $2, updated_at = NOW()`,
      [user.tenantId, customerId, user.email],
    );
  }

  const seats = billing?.seats ?? 1;
  const origin = url.origin;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: seats }],
    subscription_data: {
      metadata: { tenant_id: user.tenantId, plan },
    },
    metadata: { tenant_id: user.tenantId, plan },
    success_url: `${origin}/console/settings/billing?checkout=success`,
    cancel_url: `${origin}/console/settings/billing?checkout=canceled`,
    allow_promotion_codes: true,
  });

  return json({ url: session.url });
};
