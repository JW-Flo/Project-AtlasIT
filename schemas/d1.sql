-- Orchestrator durable object support tables
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  available_at TEXT,
  backoff_seconds INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dead_letters (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  replay_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  payload TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  rolled_up_at TEXT
);

CREATE TABLE IF NOT EXISTS idempotency (
  hash TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metrics (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
  hash TEXT PRIMARY KEY,
  control TEXT NOT NULL,
  subject TEXT NOT NULL,
  result TEXT NOT NULL,
  timestamp INTEGER
);
