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

export interface SyncResult {
  users: {
    created: number;
    updated: number;
    total: number;
  };
  accounts: number;
}
