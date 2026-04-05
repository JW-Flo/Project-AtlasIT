import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/** POST /api/billing/portal — create a Stripe billing portal session */
export const POST: RequestHandler = async ({ locals, platform, url }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = (platform?.env as any)?.DB;
  const env = (platform?.env as any) || {};
  if (!db) {
    return json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const billing = await db
      .prepare("SELECT stripe_customer_id FROM tenant_billing WHERE tenant_id = ?")
      .bind(user.tenantId)
      .first();

    if (!billing?.stripe_customer_id) {
      return json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 404 },
      );
    }

    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      // Dev mode — redirect to billing page
      return json({ url: `${url.origin}/console/settings/billing` });
    }

    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: billing.stripe_customer_id,
        return_url: `${url.origin}/console/settings/billing`,
      }),
    });

    const portal = (await portalRes.json()) as any;
    return json({ url: portal.url });
  } catch (err: any) {
    console.error("Portal session error:", err?.message);
    return json({ error: "Failed to create billing portal session" }, { status: 500 });
  }
};
