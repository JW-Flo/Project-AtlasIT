import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { gateFeature } from "$lib/server/tier-gate";
import type { SSOConfigRow } from "@atlasit/shared/sso/types";
import { rowToConfig } from "@atlasit/shared/sso/types";
import { discoverOidcEndpoints } from "@atlasit/shared/sso/oidc";

/**
 * GET /api/tenant/sso — retrieve SSO configuration for the current tenant.
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  try {
    // Tier gate: SSO requires Professional or higher
    const gate = await gateFeature(db, user.tenantId, "sso", user.superAdmin);
    if (gate) return gate;

    const row = await db
      .prepare("SELECT * FROM sso_configurations WHERE tenant_id = ? LIMIT 1")
      .bind(user.tenantId)
      .first<SSOConfigRow>();

    if (!row) {
      return json({ configured: false, config: null });
    }

    const config = rowToConfig(row);
    // Never expose client_secret to the frontend
    return json({
      configured: true,
      config: {
        ...config,
        oidcClientSecret: config.oidcClientSecret ? "••••••••" : undefined,
      },
    });
  } catch (e) {
    console.error("SSO config load error:", e);
    // Table might not exist yet, or tier-gate query failed
    return json({ configured: false, config: null });
  }
};

/**
 * POST /api/tenant/sso — create or update SSO configuration.
 * Only owners and admins can configure SSO.
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const roles: string[] = user.roles ?? [];
  if (!user.superAdmin && !roles.includes("owner") && !roles.includes("admin")) {
    return json({ error: "Only owners and admins can configure SSO" }, { status: 403 });
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const gate = await gateFeature(db, user.tenantId, "sso", user.superAdmin);
  if (gate) return gate;

  const body = await request.json().catch(() => ({}));
  const {
    protocol,
    enabled,
    displayName,
    idpName,
    // SAML
    samlEntityId,
    samlSsoUrl,
    samlSloUrl,
    samlCertificate,
    samlMetadataUrl,
    samlNameIdFormat,
    // OIDC
    oidcIssuer,
    oidcClientId,
    oidcClientSecret,
    oidcScopes,
    // Behavior
    jitProvisioning,
    defaultRoles,
    forceSso,
    ssoBypassMfa,
  } = body as Record<string, any>;

  if (!protocol || (protocol !== "saml" && protocol !== "oidc")) {
    return json({ error: "protocol must be 'saml' or 'oidc'" }, { status: 400 });
  }

  // Auto-discover OIDC endpoints if issuer provided
  let authUrl = body.oidcAuthorizationUrl;
  let tokenUrl = body.oidcTokenUrl;
  let userinfoUrl = body.oidcUserinfoUrl;
  let jwksUrl = body.oidcJwksUrl;

  if (protocol === "oidc" && oidcIssuer && !authUrl) {
    const discovery = await discoverOidcEndpoints(oidcIssuer);
    if (discovery) {
      authUrl = discovery.authorization_endpoint;
      tokenUrl = discovery.token_endpoint;
      userinfoUrl = discovery.userinfo_endpoint;
      jwksUrl = discovery.jwks_uri;
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rolesJson = JSON.stringify(defaultRoles ?? ["member"]);

  try {
    // Upsert: delete existing for this tenant+protocol, then insert
    await db
      .prepare("DELETE FROM sso_configurations WHERE tenant_id = ? AND protocol = ?")
      .bind(user.tenantId, protocol)
      .run();

    await db
      .prepare(
        `INSERT INTO sso_configurations (
          id, tenant_id, protocol, enabled, display_name, idp_name,
          saml_entity_id, saml_sso_url, saml_slo_url, saml_certificate,
          saml_metadata_url, saml_name_id_format,
          oidc_issuer, oidc_client_id, oidc_client_secret,
          oidc_authorization_url, oidc_token_url, oidc_userinfo_url, oidc_jwks_url,
          oidc_scopes,
          jit_provisioning, default_roles, force_sso, sso_bypass_mfa,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        user.tenantId,
        protocol,
        enabled ? 1 : 0,
        displayName ?? null,
        idpName ?? null,
        samlEntityId ?? null,
        samlSsoUrl ?? null,
        samlSloUrl ?? null,
        samlCertificate ?? null,
        samlMetadataUrl ?? null,
        samlNameIdFormat ?? null,
        oidcIssuer ?? null,
        oidcClientId ?? null,
        oidcClientSecret ?? null,
        authUrl ?? null,
        tokenUrl ?? null,
        userinfoUrl ?? null,
        jwksUrl ?? null,
        oidcScopes ?? "openid email profile",
        jitProvisioning !== false ? 1 : 0,
        rolesJson,
        forceSso ? 1 : 0,
        ssoBypassMfa ? 1 : 0,
        now,
        now,
      )
      .run();

    return json({ success: true, id });
  } catch (e) {
    console.error("SSO config save error:", e);
    return json({ error: "Failed to save SSO configuration" }, { status: 500 });
  }
};

/**
 * DELETE /api/tenant/sso — remove SSO configuration.
 */
export const DELETE: RequestHandler = async ({ locals, platform, url }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const roles: string[] = user.roles ?? [];
  if (!user.superAdmin && !roles.includes("owner") && !roles.includes("admin")) {
    return json({ error: "Only owners and admins can manage SSO" }, { status: 403 });
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const protocol = url.searchParams.get("protocol");

  try {
    if (protocol) {
      await db
        .prepare("DELETE FROM sso_configurations WHERE tenant_id = ? AND protocol = ?")
        .bind(user.tenantId, protocol)
        .run();
    } else {
      await db
        .prepare("DELETE FROM sso_configurations WHERE tenant_id = ?")
        .bind(user.tenantId)
        .run();
    }
    return json({ success: true });
  } catch (e) {
    return json({ error: "Failed to delete SSO configuration" }, { status: 500 });
  }
};
