-- MCP Agent Registry and Event Subscriptions

CREATE TABLE IF NOT EXISTS agent_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  webhook_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'unhealthy')),
  capabilities TEXT, -- JSON array of capability strings
  schema_version TEXT DEFAULT '1.0',
  health_check_url TEXT,
  last_health_check_at TEXT,
  last_health_status TEXT CHECK(last_health_status IN ('healthy', 'degraded', 'unhealthy') OR last_health_status IS NULL),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_status ON agent_registry(status);

CREATE TABLE IF NOT EXISTS event_subscriptions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  filter_expression TEXT, -- optional JSON filter for payload matching
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(agent_id, event_type),
  FOREIGN KEY (agent_id) REFERENCES agent_registry(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_agent ON event_subscriptions(agent_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_event_type ON event_subscriptions(event_type);

CREATE TABLE IF NOT EXISTS event_deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'delivered', 'failed', 'dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TEXT,
  last_error TEXT,
  next_retry_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (agent_id) REFERENCES agent_registry(id)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_event ON event_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_agent ON event_deliveries(agent_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON event_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_retry ON event_deliveries(next_retry_at);
