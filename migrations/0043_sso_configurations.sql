-- SSO (SAML 2.0 / OIDC) configuration per tenant
CREATE TABLE IF NOT EXISTS sso_configurations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('saml', 'oidc')),
  enabled INTEGER NOT NULL DEFAULT 0,

  -- Display / meta
  display_name TEXT,
  idp_name TEXT, -- e.g. "Okta", "Azure AD", "Google Workspace"

  -- SAML fields
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_slo_url TEXT,
  saml_certificate TEXT,        -- PEM-encoded X.509 signing cert
  saml_metadata_url TEXT,
  saml_name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

  -- OIDC fields
  oidc_issuer TEXT,
  oidc_client_id TEXT,
  oidc_client_secret TEXT,      -- encrypted at rest
  oidc_authorization_url TEXT,
  oidc_token_url TEXT,
  oidc_userinfo_url TEXT,
  oidc_jwks_url TEXT,
  oidc_scopes TEXT DEFAULT 'openid email profile',

  -- Behavior
  jit_provisioning INTEGER NOT NULL DEFAULT 1,
  default_roles TEXT NOT NULL DEFAULT '["member"]',
  force_sso INTEGER NOT NULL DEFAULT 0,         -- block password login when enabled
  sso_bypass_mfa INTEGER NOT NULL DEFAULT 0,    -- skip MFA for SSO users

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, protocol)
);

CREATE INDEX IF NOT EXISTS idx_sso_config_tenant ON sso_configurations(tenant_id);

-- SSO state parameters for CSRF protection (SAML RelayState / OIDC state+code_verifier)
CREATE TABLE IF NOT EXISTS sso_auth_state (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  protocol TEXT NOT NULL,
  state TEXT NOT NULL,
  code_verifier TEXT,           -- PKCE code_verifier for OIDC
  redirect_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sso_state_lookup ON sso_auth_state(state);
CREATE INDEX IF NOT EXISTS idx_sso_state_expires ON sso_auth_state(expires_at);
