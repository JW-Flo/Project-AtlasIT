import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/** POST /api/billing/webhook — Stripe webhook handler */
export const POST: RequestHandler = async ({ request, platform }) => {
  const db = (platform?.env as any)?.DB;
  const env = (platform?.env as any) || {};
  if (!db) {
    return json({ error: "Database unavailable" }, { status: 503 });
  }

  const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  // In production, verify webhook signature
  if (stripeWebhookSecret && signature) {
    // Stripe signature verification would go here
    // For CF Workers, use the Stripe SDK or manual HMAC verification
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventType = event.type as string;
  const data = event.data?.object;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const tenantId = data.subscription_metadata?.tenant_id || data.metadata?.tenant_id;
        const plan = data.subscription_metadata?.plan || data.metadata?.plan;
        if (tenantId && plan) {
          await db
            .prepare(
              `UPDATE tenant_billing SET
                stripe_subscription_id = ?,
                plan = ?,
                status = 'active',
                updated_at = datetime('now')
              WHERE tenant_id = ?`,
            )
            .bind(data.subscription, plan, tenantId)
            .run();

          await db
            .prepare("UPDATE tenants SET tier = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(plan, tenantId)
            .run();
        }
        break;
      }

      case "customer.subscription.updated": {
        const tenantId = data.metadata?.tenant_id;
        if (tenantId) {
          const status =
            data.status === "active"
              ? "active"
              : data.status === "past_due"
                ? "past_due"
                : data.status === "trialing"
                  ? "trialing"
                  : "active";

          await db
            .prepare(
              `UPDATE tenant_billing SET
                status = ?,
                current_period_start = ?,
                current_period_end = ?,
                canceled_at = ?,
                updated_at = datetime('now')
              WHERE tenant_id = ?`,
            )
            .bind(
              status,
              new Date(data.current_period_start * 1000).toISOString(),
              new Date(data.current_period_end * 1000).toISOString(),
              data.canceled_at ? new Date(data.canceled_at * 1000).toISOString() : null,
              tenantId,
            )
            .run();
        }
        break;
      }

      case "customer.subscription.deleted": {
        const tenantId = data.metadata?.tenant_id;
        if (tenantId) {
          await db
            .prepare(
              `UPDATE tenant_billing SET status = 'canceled', canceled_at = datetime('now'), updated_at = datetime('now') WHERE tenant_id = ?`,
            )
            .bind(tenantId)
            .run();

          await db
            .prepare("UPDATE tenants SET tier = 'free', updated_at = datetime('now') WHERE id = ?")
            .bind(tenantId)
            .run();
        }
        break;
      }

      case "invoice.paid": {
        const tenantId = data.subscription_details?.metadata?.tenant_id || data.metadata?.tenant_id;
        if (tenantId) {
          await db
            .prepare(
              `INSERT INTO invoices (id, tenant_id, stripe_invoice_id, amount_cents, currency, status, period_start, period_end, paid_at, pdf_url, created_at)
               VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, datetime('now'), ?, datetime('now'))`,
            )
            .bind(
              crypto.randomUUID(),
              tenantId,
              data.id,
              data.amount_paid,
              data.currency,
              new Date(data.period_start * 1000).toISOString(),
              new Date(data.period_end * 1000).toISOString(),
              data.invoice_pdf,
            )
            .run();
        }
        break;
      }

      case "invoice.payment_failed": {
        const tenantId = data.subscription_details?.metadata?.tenant_id;
        if (tenantId) {
          await db
            .prepare(
              "UPDATE tenant_billing SET status = 'past_due', updated_at = datetime('now') WHERE tenant_id = ?",
            )
            .bind(tenantId)
            .run();
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err?.message);
    return json({ error: "Webhook processing failed" }, { status: 500 });
  }
};
