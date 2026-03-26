import type { Context } from "hono";
import type {
  Bindings,
  Variables,
  StripeEvent,
  StripePerson,
  StripeCustomer,
  StripeProduct,
  StripeSubscription,
} from "./types.js";
import { publishEvent } from "./event-publisher.js";

const HANDLED_EVENT_TYPES = new Set([
  "person.created",
  "person.updated",
  "person.deleted",
  "account.updated",
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "product.created",
  "product.updated",
  "product.deleted",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

function mapEventType(stripeType: string): string | null {
  switch (stripeType) {
    case "person.created":
      return "user.provisioned";
    case "person.updated":
      return "user.updated";
    case "person.deleted":
      return "user.deprovisioned";
    case "account.updated":
      return "account.updated";
    case "customer.created":
      return "billing.customer.created";
    case "customer.updated":
      return "billing.customer.updated";
    case "customer.deleted":
      return "billing.customer.deleted";
    case "invoice.paid":
      return "billing.invoice.paid";
    case "invoice.payment_failed":
      return "billing.invoice.payment_failed";
    case "product.created":
      return "billing.product.created";
    case "product.updated":
      return "billing.product.updated";
    case "product.deleted":
      return "billing.product.deleted";
    case "customer.subscription.created":
      return "billing.subscription.created";
    case "customer.subscription.updated":
      return "billing.subscription.updated";
    case "customer.subscription.deleted":
      return "billing.subscription.deleted";
    default:
      return null;
  }
}

function buildPersonPayload(person: StripePerson): Record<string, unknown> {
  const parts = [person.first_name, person.last_name].filter(Boolean);
  const displayName =
    parts.length > 0 ? parts.join(" ") : (person.email ?? person.id);

  return {
    externalId: `${person.account}:${person.id}`,
    personId: person.id,
    accountId: person.account,
    email: person.email,
    displayName,
    firstName: person.first_name,
    lastName: person.last_name,
    relationship: person.relationship,
  };
}

function buildCustomerPayload(
  customer: StripeCustomer,
): Record<string, unknown> {
  return {
    externalId: `cus:${customer.id}`,
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    description: customer.description,
    delinquent: customer.delinquent,
    currency: customer.currency,
    metadata: customer.metadata,
  };
}

function buildProductPayload(
  product: StripeProduct,
): Record<string, unknown> {
  return {
    externalId: `prod:${product.id}`,
    productId: product.id,
    name: product.name,
    description: product.description,
    active: product.active,
    defaultPrice: product.default_price,
    metadata: product.metadata,
  };
}

function buildSubscriptionPayload(
  subscription: StripeSubscription,
): Record<string, unknown> {
  return {
    externalId: `sub:${subscription.id}`,
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    items: subscription.items.data.map((item) => ({
      id: item.id,
      priceId: item.price.id,
      productId: item.price.product,
      unitAmount: item.price.unit_amount,
      currency: item.price.currency,
      interval: item.price.recurring?.interval ?? null,
    })),
    metadata: subscription.metadata,
  };
}

function buildInvoicePayload(
  invoice: Record<string, unknown>,
): Record<string, unknown> {
  return {
    externalId: `inv:${invoice["id"] as string}`,
    invoiceId: invoice["id"] as string,
    customerId: invoice["customer"] as string,
    status: invoice["status"] as string,
    amountDue: invoice["amount_due"] as number,
    amountPaid: invoice["amount_paid"] as number,
    currency: invoice["currency"] as string,
    subscriptionId: (invoice["subscription"] as string) ?? null,
  };
}

/**
 * Verify Stripe webhook signature.
 *
 * Stripe-Signature header format: t=<timestamp>,v1=<signature>[,v1=<signature>...]
 * Signed payload: <timestamp>.<rawBody>
 * Signature: HMAC-SHA256(webhook_secret, signed_payload)
 *
 * Tolerance window: 300 seconds (5 minutes) to reject replay attacks.
 */
async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string,
  toleranceSec = 300,
): Promise<boolean> {
  const elements = signatureHeader.split(",");
  const timestampEl = elements.find((e) => e.startsWith("t="));
  const signatureEls = elements.filter((e) => e.startsWith("v1="));

  if (!timestampEl || signatureEls.length === 0) {
    return false;
  }

  const timestamp = parseInt(timestampEl.slice(2), 10);
  if (isNaN(timestamp)) {
    return false;
  }

  // Reject events outside tolerance window
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSec) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload),
  );
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Accept if any v1 signature matches (Stripe may include multiple during secret rotation)
  return signatureEls.some((el) => {
    const sig = el.slice(3); // strip "v1="
    return timingSafeEqual(sig, expectedSig);
  });
}

/** Constant-time string comparison to prevent timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function handleStripeWebhook(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("Stripe-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing Stripe-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifyStripeSignature(
    rawBody,
    signatureHeader,
    c.env.STRIPE_WEBHOOK_SECRET,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid Stripe webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return c.json({ error: "Invalid JSON body", correlationId }, 400);
  }

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    return c.json({ status: "ignored", eventType: event.type, correlationId });
  }

  const atlasEventType = mapEventType(event.type);
  if (!atlasEventType) {
    return c.json({ status: "ignored", eventType: event.type, correlationId });
  }

  // Extract tenant from metadata or header — webhook events require tenant mapping
  const tenantId = c.req.header("X-Tenant-ID") ?? extractTenantFromEvent(event);

  if (!tenantId) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        eventId: event.id,
        message: "Cannot determine tenant for Stripe event",
      }),
    );
    return c.json({ error: "Unable to determine tenant", correlationId }, 400);
  }

  try {
    let payload: Record<string, unknown>;
    const basePayload = {
      stripeEventId: event.id,
      stripeEventType: event.type,
    };

    if (event.type.startsWith("person.")) {
      const person = event.data.object as unknown as StripePerson;
      payload = { ...basePayload, ...buildPersonPayload(person) };
    } else if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object as unknown as StripeSubscription;
      payload = { ...basePayload, ...buildSubscriptionPayload(subscription) };
    } else if (event.type.startsWith("customer.")) {
      const customer = event.data.object as unknown as StripeCustomer;
      payload = { ...basePayload, ...buildCustomerPayload(customer) };
    } else if (event.type.startsWith("product.")) {
      const product = event.data.object as unknown as StripeProduct;
      payload = { ...basePayload, ...buildProductPayload(product) };
    } else if (event.type.startsWith("invoice.")) {
      payload = { ...basePayload, ...buildInvoicePayload(event.data.object) };
    } else if (event.type === "account.updated") {
      payload = {
        ...basePayload,
        accountId: event.data.object["id"] as string,
        previousAttributes: event.data.previous_attributes,
      };
    } else {
      payload = {
        ...basePayload,
        objectId: event.data.object["id"] as string,
      };
    }

    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:stripe",
      payload,
      idempotencyKey: event.id,
      correlationId,
    });

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        eventId: event.id,
        message: "Stripe webhook processed",
        stripeEventType: event.type,
        atlasEventType,
        tenantId,
      }),
    );

    return c.json({ status: "processed", eventId: event.id, correlationId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        eventId: event.id,
        message: "Failed to process Stripe webhook",
        error: errorMsg,
      }),
    );
    return c.json({ error: "Processing failed", correlationId }, 500);
  }
}

/**
 * Attempt to extract tenant ID from event metadata.
 * Connected accounts can store tenant_id in their metadata.
 */
function extractTenantFromEvent(event: StripeEvent): string | null {
  const obj = event.data.object;
  const metadata = obj["metadata"] as Record<string, string> | undefined;
  return metadata?.["tenant_id"] ?? null;
}
