import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { queryPgOne } from "$lib/server/pg";
import { getStripe } from "$lib/server/stripe";

export const POST: RequestHandler = async ({ locals, url }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const billing = await queryPgOne<{ stripe_customer_id: string | null }>(
    `SELECT stripe_customer_id FROM tenant_billing WHERE tenant_id = $1`,
    [user.tenantId],
  );

  if (!billing?.stripe_customer_id) {
    return json({ error: "No billing account found. Subscribe to a plan first." }, { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${url.origin}/console/settings/billing`,
  });

  return json({ url: session.url });
};
