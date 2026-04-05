-- Track adapter evidence collection health per tenant
CREATE TABLE IF NOT EXISTS adapter_collection_health (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  adapter_slug TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  items_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  UNIQUE(tenant_id, adapter_slug)
);
