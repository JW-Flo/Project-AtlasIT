export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

export interface Variables {
  correlationId: string;
}

// --- Stripe API types ---

export interface StripeAddress {
  city: string | null;
  country: string | null;
  line1: string | null;
  line2: string | null;
  postal_code: string | null;
  state: string | null;
}

export interface StripeDob {
  day: number | null;
  month: number | null;
  year: number | null;
}

export interface StripePerson {
  id: string;
  object: "person";
  account: string;
  created: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: StripeAddress | null;
  dob: StripeDob | null;
  relationship: {
    director: boolean | null;
    executive: boolean | null;
    owner: boolean | null;
    representative: boolean | null;
    title: string | null;
    percent_ownership: number | null;
  } | null;
  metadata: Record<string, string>;
}

export interface StripeAccount {
  id: string;
  object: "account";
  business_profile: {
    name: string | null;
    url: string | null;
  } | null;
  company: {
    name: string | null;
  } | null;
  email: string | null;
  type: string;
  created: number;
  metadata: Record<string, string>;
}

export interface StripeList<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  url: string;
}

export interface StripeEvent {
  id: string;
  object: "event";
  type: string;
  created: number;
  livemode: boolean;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  } | null;
}

// --- Stripe Customer types ---

export interface StripeCustomer {
  id: string;
  object: "customer";
  email: string | null;
  name: string | null;
  phone: string | null;
  description: string | null;
  address: StripeAddress | null;
  created: number;
  delinquent: boolean;
  currency: string | null;
  default_source: string | null;
  metadata: Record<string, string>;
}

// --- Stripe Product types ---

export interface StripeProduct {
  id: string;
  object: "product";
  name: string;
  description: string | null;
  active: boolean;
  created: number;
  default_price: string | null;
  metadata: Record<string, string>;
}

// --- Stripe Subscription types ---

export interface StripeSubscription {
  id: string;
  object: "subscription";
  customer: string;
  status: string;
  created: number;
  current_period_start: number;
  current_period_end: number;
  items: {
    object: "list";
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
        unit_amount: number | null;
        currency: string;
        recurring: {
          interval: string;
          interval_count: number;
        } | null;
      };
    }>;
  };
  metadata: Record<string, string>;
}

// --- Sync types ---

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

export interface FullSyncResult {
  users: SyncResult;
  groups: SyncResult;
  memberships: number;
}
