import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { queryPg } from "$lib/server/pg";
import { getStripe } from "$lib/server/stripe";
import type Stripe from "stripe";

export const POST: RequestHandler = async ({ request }) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  if (webhookSecret && signature) {
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", (err as Error).message);
      return json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(payload) as Stripe.Event;
    } catch {
      return json({ error: "Invalid payload" }, { status: 400 });
    }
  }

  const data = (event.data?.object ?? {}) as Record<string, unknown>;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const metadata = (data.subscription_metadata ?? data.metadata ?? {}) as Record<
          string,
          string
        >;
        const tenantId = metadata.tenant_id;
        const plan = metadata.plan;
        if (tenantId && plan) {
          await queryPg(
            `UPDATE tenant_billing SET
              stripe_subscription_id = $1,
              plan = $2,
              status = 'active',
              updated_at = NOW()
            WHERE tenant_id = $3`,
            [data.subscription as string, plan, tenantId],
          );
          await queryPg(`UPDATE tenants SET tier = $1, updated_at = NOW() WHERE id = $2`, [
            plan,
            tenantId,
          ]);
        }
        break;
      }

      case "customer.subscription.updated": {
        const metadata = (data.metadata ?? {}) as Record<string, string>;
        const tenantId = metadata.tenant_id;
        if (tenantId) {
          const rawStatus = data.status as string;
          const status =
            rawStatus === "past_due"
              ? "past_due"
              : rawStatus === "trialing"
                ? "trialing"
                : rawStatus === "canceled"
                  ? "canceled"
                  : "active";

          await queryPg(
            `UPDATE tenant_billing SET
              status = $1,
              current_period_start = $2,
              current_period_end = $3,
              canceled_at = $4,
              updated_at = NOW()
            WHERE tenant_id = $5`,
            [
              status,
              new Date((data.current_period_start as number) * 1000).toISOString(),
              new Date((data.current_period_end as number) * 1000).toISOString(),
              data.canceled_at ? new Date((data.canceled_at as number) * 1000).toISOString() : null,
              tenantId,
            ],
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const metadata = (data.metadata ?? {}) as Record<string, string>;
        const tenantId = metadata.tenant_id;
        if (tenantId) {
          await queryPg(
            `UPDATE tenant_billing SET status = 'canceled', canceled_at = NOW(), updated_at = NOW() WHERE tenant_id = $1`,
            [tenantId],
          );
          await queryPg(`UPDATE tenants SET tier = 'free', updated_at = NOW() WHERE id = $1`, [
            tenantId,
          ]);
        }
        break;
      }

      case "invoice.paid": {
        const subDetails = (data.subscription_details ?? {}) as Record<string, unknown>;
        const subMetadata = (subDetails.metadata ?? {}) as Record<string, string>;
        const tenantId =
          subMetadata.tenant_id || ((data.metadata ?? {}) as Record<string, string>).tenant_id;
        if (tenantId) {
          await queryPg(
            `INSERT INTO invoices (id, tenant_id, stripe_invoice_id, amount_cents, currency, status, period_start, period_end, paid_at, pdf_url, created_at)
             VALUES ($1, $2, $3, $4, $5, 'paid', $6, $7, NOW(), $8, NOW())
             ON CONFLICT (stripe_invoice_id) DO NOTHING`,
            [
              crypto.randomUUID(),
              tenantId,
              data.id as string,
              data.amount_paid as number,
              data.currency as string,
              new Date((data.period_start as number) * 1000).toISOString(),
              new Date((data.period_end as number) * 1000).toISOString(),
              data.invoice_pdf as string | null,
            ],
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const subDetails = (data.subscription_details ?? {}) as Record<string, unknown>;
        const subMetadata = (subDetails.metadata ?? {}) as Record<string, string>;
        const tenantId = subMetadata.tenant_id;
        if (tenantId) {
          await queryPg(
            `UPDATE tenant_billing SET status = 'past_due', updated_at = NOW() WHERE tenant_id = $1`,
            [tenantId],
          );
        }
        break;
      }

      default:
        break;
    }

    return json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", (err as Error).message);
    return json({ error: "Webhook processing failed" }, { status: 500 });
  }
};
