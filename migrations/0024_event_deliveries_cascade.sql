-- Add ON DELETE CASCADE to event_deliveries foreign keys.
-- SQLite doesn't support ALTER TABLE to modify constraints, so we
-- recreate the table with the correct FK clauses.

CREATE TABLE IF NOT EXISTS event_deliveries_new (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'delivered', 'failed', 'dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_retry_at TEXT,
  error_message TEXT,
  response_status INTEGER,
  response_body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agent_registry(id) ON DELETE CASCADE
);

-- Explicit column mapping: old schema (0008) had max_attempts + last_error;
-- new schema replaces with error_message + response_status + response_body.
INSERT OR IGNORE INTO event_deliveries_new
  (id, event_id, agent_id, status, attempts, last_attempt_at, next_retry_at, error_message, created_at)
  SELECT id, event_id, agent_id, status, attempts, last_attempt_at, next_retry_at, last_error, created_at
  FROM event_deliveries;
DROP TABLE IF EXISTS event_deliveries;
ALTER TABLE event_deliveries_new RENAME TO event_deliveries;

CREATE INDEX IF NOT EXISTS idx_deliveries_event ON event_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_agent ON event_deliveries(agent_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON event_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_retry ON event_deliveries(next_retry_at);
