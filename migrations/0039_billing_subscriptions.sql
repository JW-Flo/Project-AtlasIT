-- Phase 16: Billing & subscription infrastructure
-- Adds subscription tracking, usage metering, and plugin framework tables

-- Tenant billing details
CREATE TABLE IF NOT EXISTS tenant_billing (
  tenant_id TEXT PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  billing_email TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'starter', 'professional', 'enterprise')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK(billing_cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'past_due', 'canceled', 'trialing')),
  trial_ends_at TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  canceled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Usage metering for billing
CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_metric ON usage_records(tenant_id, metric, period_start);

-- Invoice history
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  paid_at TEXT,
  pdf_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id, created_at DESC);

-- Compliance packs (Plugin API)
CREATE TABLE IF NOT EXISTS compliance_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  author TEXT NOT NULL DEFAULT 'atlasit',
  version TEXT NOT NULL DEFAULT '1.0.0',
  framework_id TEXT NOT NULL,
  controls_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'deprecated')),
  is_builtin INTEGER NOT NULL DEFAULT 0,
  config_schema TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Compliance pack controls
CREATE TABLE IF NOT EXISTS compliance_pack_controls (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL,
  control_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  evidence_types TEXT,
  weight REAL NOT NULL DEFAULT 1.0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (pack_id) REFERENCES compliance_packs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pack_controls_pack ON compliance_pack_controls(pack_id);

-- Tenant compliance pack installations
CREATE TABLE IF NOT EXISTS tenant_compliance_packs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  config TEXT,
  UNIQUE(tenant_id, pack_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (pack_id) REFERENCES compliance_packs(id)
);
