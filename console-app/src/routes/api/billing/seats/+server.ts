import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { queryPg, queryPgOne } from "$lib/server/pg";
import { getStripe } from "$lib/server/stripe";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const billing = await queryPgOne<{ plan: string; seats: number }>(
    `SELECT plan, COALESCE(seats, 1) as seats FROM tenant_billing WHERE tenant_id = $1`,
    [user.tenantId],
  );

  const activeUsers = await queryPgOne<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM console_users WHERE tenant_id = $1`,
    [user.tenantId],
  );

  return json({
    status: "success",
    data: {
      seats: billing?.seats ?? 1,
      activeUsers: parseInt(activeUsers?.count ?? "0", 10),
      plan: billing?.plan ?? "free",
    },
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, { status: 400 });

  const seats = typeof body.seats === "number" ? Math.max(1, Math.floor(body.seats)) : null;
  if (!seats) {
    return json({ error: "seats must be a positive integer" }, { status: 400 });
  }

  const billing = await queryPgOne<{
    stripe_subscription_id: string | null;
    plan: string;
  }>(`SELECT stripe_subscription_id, plan FROM tenant_billing WHERE tenant_id = $1`, [
    user.tenantId,
  ]);

  if (billing?.stripe_subscription_id) {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(billing.stripe_subscription_id);
    const item = sub.items.data[0];
    if (item) {
      await stripe.subscriptions.update(billing.stripe_subscription_id, {
        items: [{ id: item.id, quantity: seats }],
        proration_behavior: "create_prorations",
      });
    }
  }

  await queryPg(`UPDATE tenant_billing SET seats = $1, updated_at = NOW() WHERE tenant_id = $2`, [
    seats,
    user.tenantId,
  ]);

  return json({
    status: "success",
    data: { seats, plan: billing?.plan ?? "free" },
  });
};
