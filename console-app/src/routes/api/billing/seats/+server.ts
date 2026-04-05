import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * GET /api/billing/seats — returns current seat count and subscription info
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  try {
    const billing = await db
      .prepare(
        "SELECT plan, stripe_subscription_id, seat_count FROM tenant_billing WHERE tenant_id = ?",
      )
      .bind(user.tenantId)
      .first<{ plan: string; stripe_subscription_id: string | null; seat_count: number | null }>();

    const activeUsers = await db
      .prepare("SELECT COUNT(*) as cnt FROM console_user_roles WHERE tenant_id = ?")
      .bind(user.tenantId)
      .first<{ cnt: number }>();

    return json({
      seats: billing?.seat_count ?? activeUsers?.cnt ?? 1,
      activeUsers: activeUsers?.cnt ?? 0,
      plan: billing?.plan ?? "free",
      hasSubscription: !!billing?.stripe_subscription_id,
    });
  } catch (e) {
    console.error("Seat count error:", e);
    return json({ error: "Failed to load seat info" }, { status: 500 });
  }
};

/**
 * POST /api/billing/seats — update seat count on an active subscription.
 * Stripe prorates the change automatically.
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles: string[] = (locals as any).user?.roles ?? [];
  if (!user.superAdmin && !roles.includes("owner") && !roles.includes("admin")) {
    return json({ error: "Only owners and admins can manage seats" }, { status: 403 });
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  const env = (platform?.env as any) || {};
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { seats } = body as { seats: number };

  if (!seats || seats < 5) {
    return json({ error: "Minimum 5 seats required" }, { status: 400 });
  }
  if (seats > 10000) {
    return json({ error: "Contact sales for more than 10,000 seats" }, { status: 400 });
  }

  try {
    const billing = await db
      .prepare(
        "SELECT stripe_subscription_id, stripe_customer_id, plan FROM tenant_billing WHERE tenant_id = ?",
      )
      .bind(user.tenantId)
      .first<{
        stripe_subscription_id: string | null;
        stripe_customer_id: string | null;
        plan: string;
      }>();

    if (!billing?.stripe_subscription_id) {
      return json({ error: "No active subscription. Subscribe to a plan first." }, { status: 400 });
    }

    // Check active user count — can't reduce below active users
    const activeUsers = await db
      .prepare("SELECT COUNT(*) as cnt FROM console_user_roles WHERE tenant_id = ?")
      .bind(user.tenantId)
      .first<{ cnt: number }>();

    if (seats < (activeUsers?.cnt ?? 0)) {
      return json(
        {
          error: `Cannot reduce below ${activeUsers?.cnt} seats — you have ${activeUsers?.cnt} active users. Remove users first.`,
        },
        { status: 400 },
      );
    }

    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      // Dev mode — just update DB
      await db
        .prepare(
          "UPDATE tenant_billing SET seat_count = ?, updated_at = datetime('now') WHERE tenant_id = ?",
        )
        .bind(seats, user.tenantId)
        .run();
      return json({ success: true, seats });
    }

    // Retrieve the subscription to get the item ID
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${billing.stripe_subscription_id}`,
      {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      },
    );
    const subscription = (await subRes.json()) as any;

    if (!subscription?.items?.data?.[0]?.id) {
      return json({ error: "Subscription item not found" }, { status: 500 });
    }

    const itemId = subscription.items.data[0].id;

    // Update the subscription quantity — Stripe prorates automatically
    const updateRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${billing.stripe_subscription_id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          [`items[0][id]`]: itemId,
          [`items[0][quantity]`]: String(seats),
          proration_behavior: "create_prorations",
        }),
      },
    );

    const updated = (await updateRes.json()) as any;
    if (updated.error) {
      console.error("Stripe seat update error:", updated.error);
      return json({ error: updated.error.message || "Failed to update seats" }, { status: 500 });
    }

    // Update local DB
    await db
      .prepare(
        "UPDATE tenant_billing SET seat_count = ?, updated_at = datetime('now') WHERE tenant_id = ?",
      )
      .bind(seats, user.tenantId)
      .run();

    return json({ success: true, seats });
  } catch (e) {
    console.error("Seat update error:", e);
    return json({ error: "Failed to update seat count" }, { status: 500 });
  }
};
