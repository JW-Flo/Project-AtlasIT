# Stripe Billing Setup

## Prerequisites

- Stripe account with AtlasIT product configured
- Cloudflare Workers CLI (`wrangler`) authenticated

## Set Worker Secrets

Run these commands from the project root to configure Stripe keys as worker secrets:

```bash
# Secret key (server-side only — never expose in client code)
echo "<REPLACE_WITH_STRIPE_SECRET_KEY>" | npx wrangler secret put STRIPE_SECRET_KEY --name atlasit-console

# Publishable key (safe for client-side)
echo "<REPLACE_WITH_STRIPE_PUBLISHABLE_KEY>" | npx wrangler secret put STRIPE_PUBLISHABLE_KEY --name atlasit-console

# Webhook signing secret (from Stripe Dashboard → Webhooks)
echo "<REPLACE_WITH_WEBHOOK_SECRET>" | npx wrangler secret put STRIPE_WEBHOOK_SECRET --name atlasit-console
```

## Create Stripe Products & Prices

Create these products and prices in the Stripe Dashboard, then set the price IDs:

| Plan         | Cycle   | Price    | Secret Key                          |
| ------------ | ------- | -------- | ----------------------------------- |
| Starter      | Monthly | $8/user  | `STRIPE_PRICE_STARTER_MONTHLY`      |
| Starter      | Annual  | $6/user  | `STRIPE_PRICE_STARTER_ANNUAL`       |
| Professional | Monthly | $16/user | `STRIPE_PRICE_PROFESSIONAL_MONTHLY` |
| Professional | Annual  | $12/user | `STRIPE_PRICE_PROFESSIONAL_ANNUAL`  |

```bash
echo "price_..." | npx wrangler secret put STRIPE_PRICE_STARTER_MONTHLY --name atlasit-console
echo "price_..." | npx wrangler secret put STRIPE_PRICE_STARTER_ANNUAL --name atlasit-console
echo "price_..." | npx wrangler secret put STRIPE_PRICE_PROFESSIONAL_MONTHLY --name atlasit-console
echo "price_..." | npx wrangler secret put STRIPE_PRICE_PROFESSIONAL_ANNUAL --name atlasit-console
```

## Webhook Endpoint

Configure the Stripe webhook endpoint in Dashboard → Developers → Webhooks:

- **URL**: `https://www.atlasit.pro/api/billing/webhook`
- **Events to listen for**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

## Development Mode

When `STRIPE_SECRET_KEY` is not set, the billing system operates in development mode:

- Checkout creates a simulated session and activates the plan immediately
- Portal redirects back to the billing page
- No actual charges are made

## 1Password Reference

Stripe credentials are stored in 1Password vault `AWW_SHARED`, item "Stripe - AtlasIT".
