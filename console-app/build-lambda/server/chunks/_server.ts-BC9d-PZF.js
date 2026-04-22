import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  try {
    const billing = await db.prepare(
      "SELECT plan, stripe_subscription_id, seat_count FROM tenant_billing WHERE tenant_id = ?"
    ).bind(user.tenantId).first();
    const activeUsers = await db.prepare("SELECT COUNT(*) as cnt FROM console_user_roles WHERE tenant_id = ?").bind(user.tenantId).first();
    return json({
      seats: billing?.seat_count ?? activeUsers?.cnt ?? 1,
      activeUsers: activeUsers?.cnt ?? 0,
      plan: billing?.plan ?? "free",
      hasSubscription: !!billing?.stripe_subscription_id
    });
  } catch (e) {
    console.error("Seat count error:", e);
    return json({ error: "Failed to load seat info" }, { status: 500 });
  }
};
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const roles = locals.user?.roles ?? [];
  if (!user.superAdmin && !roles.includes("owner") && !roles.includes("admin")) {
    return json({ error: "Only owners and admins can manage seats" }, { status: 403 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  const env = platform?.env || {};
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const { seats } = body;
  if (!seats || seats < 5) {
    return json({ error: "Minimum 5 seats required" }, { status: 400 });
  }
  if (seats > 1e4) {
    return json({ error: "Contact sales for more than 10,000 seats" }, { status: 400 });
  }
  try {
    const billing = await db.prepare(
      "SELECT stripe_subscription_id, stripe_customer_id, plan FROM tenant_billing WHERE tenant_id = ?"
    ).bind(user.tenantId).first();
    if (!billing?.stripe_subscription_id) {
      return json({ error: "No active subscription. Subscribe to a plan first." }, { status: 400 });
    }
    const activeUsers = await db.prepare("SELECT COUNT(*) as cnt FROM console_user_roles WHERE tenant_id = ?").bind(user.tenantId).first();
    if (seats < (activeUsers?.cnt ?? 0)) {
      return json(
        {
          error: `Cannot reduce below ${activeUsers?.cnt} seats — you have ${activeUsers?.cnt} active users. Remove users first.`
        },
        { status: 400 }
      );
    }
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      await db.prepare(
        "UPDATE tenant_billing SET seat_count = ?, updated_at = datetime('now') WHERE tenant_id = ?"
      ).bind(seats, user.tenantId).run();
      return json({ success: true, seats });
    }
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${billing.stripe_subscription_id}`,
      {
        headers: { Authorization: `Bearer ${stripeSecretKey}` }
      }
    );
    const subscription = await subRes.json();
    if (!subscription?.items?.data?.[0]?.id) {
      return json({ error: "Subscription item not found" }, { status: 500 });
    }
    const itemId = subscription.items.data[0].id;
    const updateRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${billing.stripe_subscription_id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          [`items[0][id]`]: itemId,
          [`items[0][quantity]`]: String(seats),
          proration_behavior: "create_prorations"
        })
      }
    );
    const updated = await updateRes.json();
    if (updated.error) {
      console.error("Stripe seat update error:", updated.error);
      return json({ error: updated.error.message || "Failed to update seats" }, { status: 500 });
    }
    await db.prepare(
      "UPDATE tenant_billing SET seat_count = ?, updated_at = datetime('now') WHERE tenant_id = ?"
    ).bind(seats, user.tenantId).run();
    return json({ success: true, seats });
  } catch (e) {
    console.error("Seat update error:", e);
    return json({ error: "Failed to update seat count" }, { status: 500 });
  }
};

export { GET, POST };
//# sourceMappingURL=_server.ts-BC9d-PZF.js.map
