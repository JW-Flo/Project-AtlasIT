CREATE TABLE IF NOT EXISTS growth_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  invite_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_growth_events_event ON growth_events (event_name);
CREATE INDEX IF NOT EXISTS idx_growth_events_invite ON growth_events (invite_id);
