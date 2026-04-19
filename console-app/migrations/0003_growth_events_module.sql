ALTER TABLE growth_events ADD COLUMN module TEXT;

CREATE INDEX IF NOT EXISTS idx_growth_events_module ON growth_events (module);
