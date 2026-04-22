import { json } from '@sveltejs/kit';

const POST = async ({ request, locals, platform, url }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  const env = platform?.env || {};
  if (!db) {
    return json({ error: "Database unavailable" }, { status: 503 });
  }
  const body = await request.json();
  const { plan, cycle } = body;
  if (!["starter", "professional", "enterprise"].includes(plan)) {
    return json({ error: "Invalid plan" }, { status: 400 });
  }
  if (!["monthly", "annual"].includes(cycle)) {
    return json({ error: "Invalid billing cycle" }, { status: 400 });
  }
  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    const sessionId = `cs_dev_${crypto.randomUUID()}`;
    await db.prepare(
      `INSERT INTO tenant_billing (tenant_id, plan, billing_cycle, status, current_period_start, current_period_end, created_at, updated_at)
         VALUES (?, ?, ?, 'trialing', datetime('now'), datetime('now', ? || ' days'), datetime('now'), datetime('now'))
         ON CONFLICT(tenant_id) DO UPDATE SET plan = ?, billing_cycle = ?, status = 'trialing', updated_at = datetime('now')`
    ).bind(user.tenantId, plan, cycle, plan === "starter" ? "+30" : "+14", plan, cycle).run();
    await db.prepare("UPDATE tenants SET tier = ?, updated_at = datetime('now') WHERE id = ?").bind(plan, user.tenantId).run();
    return json({
      url: `${url.origin}/console/settings/billing?checkout=success&session_id=${sessionId}`,
      sessionId
    });
  }
  try {
    let billing = await db.prepare("SELECT stripe_customer_id FROM tenant_billing WHERE tenant_id = ?").bind(user.tenantId).first();
    let customerId = billing?.stripe_customer_id;
    if (!customerId) {
      const tenant = await db.prepare("SELECT name FROM tenants WHERE id = ?").bind(user.tenantId).first();
      const customerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          email: user.email,
          name: tenant?.name || "",
          "metadata[tenant_id]": user.tenantId
        })
      });
      const customer = await customerRes.json();
      customerId = customer.id;
      await db.prepare(
        `INSERT INTO tenant_billing (tenant_id, stripe_customer_id, billing_email, plan, billing_cycle, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
           ON CONFLICT(tenant_id) DO UPDATE SET stripe_customer_id = ?, billing_email = ?, updated_at = datetime('now')`
      ).bind(user.tenantId, customerId, user.email, plan, cycle, customerId, user.email).run();
    }
    const priceKey = `STRIPE_PRICE_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
    const priceId = env[priceKey];
    if (!priceId) {
      return json({ error: "Price configuration missing" }, { status: 500 });
    }
    let seatCount = 5;
    try {
      const countRow = await db.prepare("SELECT COUNT(*) as cnt FROM console_user_roles WHERE tenant_id = ?").bind(user.tenantId).first();
      seatCount = Math.max(countRow?.cnt ?? 1, 5);
    } catch {
    }
    const checkoutParams = new URLSearchParams({
      customer: customerId,
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": String(seatCount),
      "line_items[0][adjustable_quantity][enabled]": "true",
      "line_items[0][adjustable_quantity][minimum]": "5",
      "line_items[0][adjustable_quantity][maximum]": plan === "starter" ? "50" : "500",
      success_url: `${url.origin}/console/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/console/settings/billing?checkout=canceled`,
      "subscription_data[trial_period_days]": plan === "starter" ? "30" : "14",
      "subscription_data[metadata][tenant_id]": user.tenantId,
      "subscription_data[metadata][plan]": plan
    });
    if (seatCount >= 10) {
      checkoutParams.set("payment_method_collection", "if_required");
    }
    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: checkoutParams
    });
    const session = await sessionRes.json();
    return json({
      url: session.url,
      sessionId: session.id
    });
  } catch (err) {
    console.error("Checkout error:", err?.message);
    return json({ error: "Failed to create checkout session" }, { status: 500 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-xFq_CxSJ.js.map
