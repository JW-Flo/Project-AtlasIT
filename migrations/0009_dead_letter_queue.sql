-- Dead letter queue for failed event deliveries

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  delivery_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL,
  event_payload TEXT,
  error_message TEXT,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TEXT,
  last_attempt_at TEXT,
  dead_lettered_at TEXT NOT NULL DEFAULT (datetime('now')),
  replayed_at TEXT,
  replay_status TEXT CHECK(replay_status IN ('pending', 'success', 'failed') OR replay_status IS NULL),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (agent_id) REFERENCES agent_registry(id)
);

CREATE INDEX IF NOT EXISTS idx_dlq_event ON dead_letter_queue(event_id);
CREATE INDEX IF NOT EXISTS idx_dlq_agent ON dead_letter_queue(agent_id);
CREATE INDEX IF NOT EXISTS idx_dlq_tenant ON dead_letter_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dlq_replay_status ON dead_letter_queue(replay_status);
