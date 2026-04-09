-- AtlasIT PostgreSQL schema — converted from D1 (SQLite) migrations
-- Source: migrations/0001–0026 (atlasit-shared database)
-- Conversion: datetime('now') → NOW(), AUTOINCREMENT → GENERATED ALWAYS AS IDENTITY,
--             TEXT PRIMARY KEY defaults → gen_random_uuid(), INTEGER → BOOLEAN where applicable

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Core: Tenants & Users
-- ============================================================

CREATE TABLE tenants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK(status IN ('active', 'suspended', 'onboarding')),
  tier TEXT NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'starter', 'professional', 'enterprise')),
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK(status IN ('active', 'inactive', 'invited')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- Integrations & Credentials
-- ============================================================

CREATE TABLE integrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('saas', 'api', 'database', 'custom')),
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK(status IN ('active', 'inactive', 'error')),
  config JSONB,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);

CREATE TABLE app_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL DEFAULT 'atlasit-prod',
  app_id TEXT NOT NULL,
  credentials TEXT NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_test_at TIMESTAMPTZ,
  healthy BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(tenant_id, app_id)
);

CREATE INDEX idx_app_credentials_tenant ON app_credentials(tenant_id);
CREATE INDEX idx_app_credentials_app ON app_credentials(app_id);

CREATE TABLE app_oauth_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL DEFAULT 'atlasit-prod',
  app_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, app_id)
);

-- ============================================================
-- Directory Sync
-- ============================================================

CREATE TABLE directory_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_msg TEXT,
  last_sync_at TIMESTAMPTZ,
  user_count INTEGER NOT NULL DEFAULT 0,
  group_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE directory_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  department TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  raw_attributes JSONB,
  source TEXT,
  console_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, external_id)
);

CREATE INDEX idx_dir_users_tenant ON directory_users(tenant_id);
CREATE INDEX idx_dir_users_email ON directory_users(tenant_id, email);
CREATE INDEX idx_directory_users_console_user_id ON directory_users(console_user_id);

CREATE TABLE directory_groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, external_id)
);

CREATE INDEX idx_dir_groups_tenant ON directory_groups(tenant_id);

CREATE TABLE directory_memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, group_id)
);

CREATE INDEX idx_dir_memberships_user ON directory_memberships(user_id);
CREATE INDEX idx_dir_memberships_group ON directory_memberships(group_id);

CREATE TABLE group_app_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  role TEXT,
  suggested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, group_id, app_id)
);

-- ============================================================
-- Events & Audit
-- ============================================================

CREATE TABLE events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created ON events(created_at);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  actor_id TEXT,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK(actor_type IN ('user', 'system', 'agent', 'api_key')),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_correlation ON audit_log(correlation_id);

-- ============================================================
-- Agent Registry & Event Delivery
-- ============================================================

CREATE TABLE agent_registry (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  webhook_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'unhealthy')),
  capabilities JSONB,
  schema_version TEXT DEFAULT '1.0',
  health_check_url TEXT,
  last_health_check_at TIMESTAMPTZ,
  last_health_status TEXT CHECK(last_health_status IN ('healthy', 'degraded', 'unhealthy')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agent_registry(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  filter_expression JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, event_type)
);

CREATE TABLE event_deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id),
  agent_id TEXT NOT NULL REFERENCES agent_registry(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'delivered', 'failed', 'dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_status ON event_deliveries(status);
CREATE INDEX idx_deliveries_retry ON event_deliveries(next_retry_at);

CREATE TABLE dead_letter_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id),
  agent_id TEXT NOT NULL REFERENCES agent_registry(id),
  delivery_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL,
  event_payload JSONB,
  error_message TEXT,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  dead_lettered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replayed_at TIMESTAMPTZ,
  replay_status TEXT CHECK(replay_status IN ('pending', 'success', 'failed'))
);

CREATE INDEX idx_dlq_tenant ON dead_letter_queue(tenant_id);

-- ============================================================
-- Onboarding
-- ============================================================

CREATE TABLE onboarding_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  status TEXT NOT NULL DEFAULT 'started' CHECK(status IN ('started', 'questions_generated', 'answers_submitted', 'provisioning', 'completed', 'failed')),
  industry TEXT,
  requirements JSONB,
  answers JSONB,
  generated_config JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Marketplace
-- ============================================================

CREATE TABLE marketplace_apps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'utility' CHECK(category IN ('identity', 'security', 'compliance', 'productivity', 'communication', 'utility', 'custom')),
  provider TEXT NOT NULL,
  logo_url TEXT,
  auth_model TEXT NOT NULL CHECK(auth_model IN ('oauth2', 'api_key', 'service_account', 'saml', 'none')),
  config_schema JSONB,
  capabilities JSONB,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'coming_soon')),
  documentation_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant_app_installs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  app_id TEXT NOT NULL REFERENCES marketplace_apps(id),
  status TEXT NOT NULL DEFAULT 'installed' CHECK(status IN ('installed', 'configuring', 'active', 'error', 'uninstalled')),
  config JSONB,
  installed_by TEXT,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  uninstalled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, app_id)
);

CREATE TABLE app_group_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, app_id, group_id)
);

CREATE TABLE app_role_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  source_role TEXT NOT NULL,
  target_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, app_id, source_role)
);

-- ============================================================
-- RBAC & Preferences
-- ============================================================

CREATE TABLE console_user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  roles JSONB NOT NULL DEFAULT '["viewer"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_console_user_roles_tenant ON console_user_roles(tenant_id);

CREATE TABLE user_preferences (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

CREATE TABLE tenant_preferences (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, key)
);

-- ============================================================
-- Automation Rules
-- ============================================================

CREATE TABLE automation_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL CHECK(trigger_type IN (
    'user_joined_group', 'user_left_group', 'user_created', 'user_deactivated',
    'app_connected', 'app_disconnected', 'app_health_changed',
    'schedule', 'compliance_score_changed'
  )),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_run_at TIMESTAMPTZ,
  last_status TEXT CHECK(last_status IN ('success', 'partial', 'failed')),
  run_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX idx_automation_rules_tenant ON automation_rules(tenant_id);
CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_type);

CREATE TABLE automation_executions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  rule_id TEXT NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_event JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'success', 'partial', 'failed')),
  actions_run INTEGER NOT NULL DEFAULT 0,
  actions_failed INTEGER NOT NULL DEFAULT 0,
  results JSONB,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE app_health_checks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  app_id TEXT NOT NULL,
  healthy BOOLEAN NOT NULL,
  response_ms INTEGER,
  error_msg TEXT,
  details JSONB,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dismissed_suggestions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  template_id TEXT NOT NULL,
  dismissed_by TEXT,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, template_id)
);

-- ============================================================
-- Incidents
-- ============================================================

CREATE TABLE incidents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved')),
  source TEXT,
  source_id TEXT,
  description TEXT,
  auto_resolve BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_incidents_tenant ON incidents(tenant_id, status);

-- ============================================================
-- JML Policies & Workflows
-- ============================================================

CREATE TABLE jml_policies (
  tenant_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  auto_joiner BOOLEAN NOT NULL DEFAULT true,
  auto_leaver BOOLEAN NOT NULL DEFAULT true,
  auto_mover BOOLEAN NOT NULL DEFAULT true,
  leaver_grace_ms INTEGER NOT NULL DEFAULT 0,
  notify_manager BOOLEAN NOT NULL DEFAULT true,
  notify_user BOOLEAN NOT NULL DEFAULT false,
  require_joiner_approval BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE directory_changelog (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT,
  change_type TEXT NOT NULL CHECK(change_type IN ('created', 'updated', 'deactivated', 'deleted', 'reactivated')),
  delta JSONB NOT NULL DEFAULT '{}'::jsonb,
  jml_action TEXT CHECK(jml_action IN ('joiner', 'leaver', 'mover', 'rehire')),
  workflow_run_id TEXT,
  source TEXT NOT NULL DEFAULT 'directory_sync',
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_changelog_tenant ON directory_changelog(tenant_id, created_at DESC);
CREATE INDEX idx_changelog_unprocessed ON directory_changelog(tenant_id, processed) WHERE processed = false;

CREATE TABLE workflow_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('joiner', 'leaver', 'mover', 'rehire', 'custom')),
  tenant_id TEXT,
  definition JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  user_id TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'running', 'completed', 'failed', 'compensating')),
  trigger TEXT NOT NULL DEFAULT 'jml_auto',
  changelog_id TEXT REFERENCES directory_changelog(id),
  steps_total INTEGER NOT NULL DEFAULT 0,
  steps_done INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error TEXT,
  context JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_wf_runs_tenant ON workflow_runs(tenant_id, started_at DESC);
CREATE INDEX idx_wf_runs_status ON workflow_runs(tenant_id, status);

CREATE TABLE activity_stream (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK(severity IN ('info', 'success', 'warning', 'error')),
  entity_type TEXT,
  entity_id TEXT,
  actor TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_tenant ON activity_stream(tenant_id, id DESC);

-- ============================================================
-- Compliance
-- ============================================================

CREATE TABLE compliance_evidence (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  framework_id TEXT,
  framework TEXT,
  control_id TEXT NOT NULL,
  control_name TEXT,
  evidence_type TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  actor TEXT,
  subject TEXT,
  data JSONB,
  metadata JSONB,
  collected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_evidence_tenant ON compliance_evidence(tenant_id, control_id);
CREATE INDEX idx_compliance_evidence_framework ON compliance_evidence(tenant_id, framework, control_id);
CREATE INDEX idx_compliance_evidence_source ON compliance_evidence(tenant_id, source, created_at);

CREATE TABLE evidence_tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  evidence_id TEXT NOT NULL REFERENCES compliance_evidence(id),
  tag TEXT NOT NULL,
  tag_type TEXT NOT NULL DEFAULT 'label',
  color TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, evidence_id, tag, tag_type)
);

CREATE TABLE compliance_scores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  framework TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  max_score DOUBLE PRECISION NOT NULL DEFAULT 100,
  grade TEXT NOT NULL DEFAULT 'F',
  controls_total INTEGER NOT NULL DEFAULT 0,
  controls_implemented INTEGER NOT NULL DEFAULT 0,
  controls_verified INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, framework)
);

CREATE TABLE compliance_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  framework TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  grade TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_history_tenant ON compliance_history(tenant_id, framework, recorded_at);

-- ============================================================
-- Access Reviews (IGA)
-- ============================================================

CREATE TABLE access_review_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed', 'expired')),
  reviewer_policy TEXT NOT NULL DEFAULT 'manager',
  due_date TIMESTAMPTZ,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE access_review_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL REFERENCES access_review_campaigns(id),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  app_id TEXT NOT NULL,
  app_name TEXT,
  role TEXT,
  reviewer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'revoked', 'skipped')),
  decided_at TIMESTAMPTZ,
  decided_by TEXT,
  notes TEXT
);

CREATE TABLE access_review_decisions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item_id TEXT NOT NULL REFERENCES access_review_items(id),
  campaign_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('approved', 'revoked')),
  decided_by TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);
