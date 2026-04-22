import { json } from '@sveltejs/kit';

const POST = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  const env = platform?.env || {};
  if (!db) {
    return json({ error: "Database unavailable" }, { status: 503 });
  }
  try {
    const billing = await db.prepare("SELECT stripe_customer_id FROM tenant_billing WHERE tenant_id = ?").bind(user.tenantId).first();
    if (!billing?.stripe_customer_id) {
      return json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 404 }
      );
    }
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return json({ url: `${url.origin}/console/settings/billing` });
    }
    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        customer: billing.stripe_customer_id,
        return_url: `${url.origin}/console/settings/billing`
      })
    });
    const portal = await portalRes.json();
    return json({ url: portal.url });
  } catch (err) {
    console.error("Portal session error:", err?.message);
    return json({ error: "Failed to create billing portal session" }, { status: 500 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-Dmq_F75M.js.map
