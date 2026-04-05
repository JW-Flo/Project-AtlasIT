/**
 * SSO configuration and identity types.
 * Shared between SAML 2.0 SP and OIDC RP implementations.
 */

export type SSOProtocol = "saml" | "oidc";

export interface SSOConfiguration {
  id: string;
  tenantId: string;
  protocol: SSOProtocol;
  enabled: boolean;
  displayName?: string;
  idpName?: string;

  // SAML
  samlEntityId?: string;
  samlSsoUrl?: string;
  samlSloUrl?: string;
  samlCertificate?: string;
  samlMetadataUrl?: string;
  samlNameIdFormat?: string;

  // OIDC
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcAuthorizationUrl?: string;
  oidcTokenUrl?: string;
  oidcUserinfoUrl?: string;
  oidcJwksUrl?: string;
  oidcScopes?: string;

  // Behavior
  jitProvisioning: boolean;
  defaultRoles: string[];
  forceSso: boolean;
  ssoBypassMfa: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface SSOIdentity {
  email: string;
  nameId?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  groups?: string[];
  rawAttributes?: Record<string, string>;
}

export interface SSOAuthState {
  id: string;
  tenantId: string;
  protocol: SSOProtocol;
  state: string;
  codeVerifier?: string;
  redirectUrl?: string;
  createdAt: string;
  expiresAt: string;
}

/** Result of processing an SSO callback (SAML response or OIDC code exchange) */
export interface SSOCallbackResult {
  success: boolean;
  identity?: SSOIdentity;
  error?: string;
  sessionIndex?: string;
}

/** Row shape from D1 sso_configurations table */
export interface SSOConfigRow {
  id: string;
  tenant_id: string;
  protocol: SSOProtocol;
  enabled: number;
  display_name: string | null;
  idp_name: string | null;
  saml_entity_id: string | null;
  saml_sso_url: string | null;
  saml_slo_url: string | null;
  saml_certificate: string | null;
  saml_metadata_url: string | null;
  saml_name_id_format: string | null;
  oidc_issuer: string | null;
  oidc_client_id: string | null;
  oidc_client_secret: string | null;
  oidc_authorization_url: string | null;
  oidc_token_url: string | null;
  oidc_userinfo_url: string | null;
  oidc_jwks_url: string | null;
  oidc_scopes: string | null;
  jit_provisioning: number;
  default_roles: string;
  force_sso: number;
  sso_bypass_mfa: number;
  created_at: string;
  updated_at: string;
}

export function rowToConfig(row: SSOConfigRow): SSOConfiguration {
  let defaultRoles: string[];
  try {
    defaultRoles = JSON.parse(row.default_roles);
  } catch {
    defaultRoles = ["member"];
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    protocol: row.protocol,
    enabled: row.enabled === 1,
    displayName: row.display_name ?? undefined,
    idpName: row.idp_name ?? undefined,
    samlEntityId: row.saml_entity_id ?? undefined,
    samlSsoUrl: row.saml_sso_url ?? undefined,
    samlSloUrl: row.saml_slo_url ?? undefined,
    samlCertificate: row.saml_certificate ?? undefined,
    samlMetadataUrl: row.saml_metadata_url ?? undefined,
    samlNameIdFormat: row.saml_name_id_format ?? undefined,
    oidcIssuer: row.oidc_issuer ?? undefined,
    oidcClientId: row.oidc_client_id ?? undefined,
    oidcClientSecret: row.oidc_client_secret ?? undefined,
    oidcAuthorizationUrl: row.oidc_authorization_url ?? undefined,
    oidcTokenUrl: row.oidc_token_url ?? undefined,
    oidcUserinfoUrl: row.oidc_userinfo_url ?? undefined,
    oidcJwksUrl: row.oidc_jwks_url ?? undefined,
    oidcScopes: row.oidc_scopes ?? undefined,
    jitProvisioning: row.jit_provisioning === 1,
    defaultRoles,
    forceSso: row.force_sso === 1,
    ssoBypassMfa: row.sso_bypass_mfa === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
