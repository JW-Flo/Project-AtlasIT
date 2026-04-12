CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'access-control','incident-response','data-protection','vendor','acceptable-use','byod','retention','other'
  version TEXT NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft','published','archived'
  framework_refs TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_policies_tenant ON policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(tenant_id, status);

CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_email TEXT,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  policy_version TEXT NOT NULL,
  UNIQUE (tenant_id, policy_id, user_id, policy_version)
);
CREATE INDEX IF NOT EXISTS idx_policy_acks_tenant ON policy_acknowledgements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_acks_policy ON policy_acknowledgements(policy_id);
