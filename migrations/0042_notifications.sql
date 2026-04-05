-- Local notification storage with entity linking
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT,
  severity TEXT DEFAULT 'info',
  -- Entity linking: what triggered this notification
  source_type TEXT,
  source_id TEXT,
  source_label TEXT,
  -- Delivery status
  read_at TEXT,
  emailed_at TEXT,
  email_error TEXT,
  -- Metadata
  action_url TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON notifications(tenant_id, user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(tenant_id, created_at);

-- User notification preferences (extends existing user_preferences)
-- Stored as JSON in user_preferences with key 'notification_channels'
-- Schema: { email: { incidents: bool, compliance: bool, automation: bool, policy: bool, directory: bool },
--           in_app: { incidents: bool, compliance: bool, automation: bool, policy: bool, directory: bool } }

-- Tenant notification routing config
-- Stored in tenant_preferences with key 'notification_routing'
-- Schema: { incident_emails: string[], compliance_emails: string[], default_emails: string[] }
