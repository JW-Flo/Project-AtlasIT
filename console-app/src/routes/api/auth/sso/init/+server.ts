import type { RequestHandler } from "@sveltejs/kit";
import { json, redirect } from "@sveltejs/kit";
import type { SSOConfigRow } from "@atlasit/shared/sso/types";
import { rowToConfig } from "@atlasit/shared/sso/types";
import { buildAuthnRequestUrl } from "@atlasit/shared/sso/saml";
import { buildAuthorizationUrl, generatePKCE } from "@atlasit/shared/sso/oidc";

const SSO_STATE_TTL_SECONDS = 600; // 10 minutes

/**
 * GET /api/auth/sso/init?tenant=<tenantId>
 * Initiates SSO login by redirecting to the IdP.
 * No session required — this is the entry point for SSO.
 */
export const GET: RequestHandler = async ({ url, platform }) => {
  const tenantId = url.searchParams.get("tenant");
  if (!tenantId) {
    return json({ error: "tenant parameter required" }, { status: 400 });
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  // Load SSO config for tenant
  let config;
  try {
    const row = await db
      .prepare("SELECT * FROM sso_configurations WHERE tenant_id = ? AND enabled = 1 LIMIT 1")
      .bind(tenantId)
      .first<SSOConfigRow>();

    if (!row) {
      return json({ error: "SSO not configured for this tenant" }, { status: 404 });
    }
    config = rowToConfig(row);
  } catch {
    return json({ error: "SSO configuration lookup failed" }, { status: 500 });
  }

  const origin = url.origin;
  const callbackUrl = `${origin}/api/auth/sso/callback`;
  const state = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SSO_STATE_TTL_SECONDS * 1000).toISOString();

  if (config.protocol === "saml") {
    const spEntityId = `${origin}/api/auth/sso/metadata`;
    const acsUrl = callbackUrl;

    // Store state for CSRF verification
    try {
      await db
        .prepare(
          `INSERT INTO sso_auth_state (id, tenant_id, protocol, state, redirect_url, created_at, expires_at)
           VALUES (?, ?, 'saml', ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), tenantId, state, "/console", now.toISOString(), expiresAt)
        .run();
    } catch (e) {
      console.error("Failed to store SSO state:", e);
    }

    let redirectUrl: string;
    try {
      redirectUrl = buildAuthnRequestUrl(config, spEntityId, acsUrl, state);
    } catch (e) {
      console.error("Failed to build SAML AuthnRequest URL:", e);
      return json({ error: "Failed to initiate SSO — check SAML configuration" }, { status: 500 });
    }
    throw redirect(302, redirectUrl);
  }

  if (config.protocol === "oidc") {
    const { codeVerifier, codeChallenge } = await generatePKCE();

    // Store state + code_verifier
    try {
      await db
        .prepare(
          `INSERT INTO sso_auth_state (id, tenant_id, protocol, state, code_verifier, redirect_url, created_at, expires_at)
           VALUES (?, ?, 'oidc', ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          tenantId,
          state,
          codeVerifier,
          "/console",
          now.toISOString(),
          expiresAt,
        )
        .run();
    } catch (e) {
      console.error("Failed to store SSO state:", e);
    }

    let authorizationUrl: string;
    try {
      authorizationUrl = await buildAuthorizationUrl(config, callbackUrl, state, codeChallenge);
    } catch (e) {
      console.error("Failed to build OIDC authorization URL:", e);
      return json({ error: "Failed to initiate SSO — check OIDC configuration" }, { status: 500 });
    }
    throw redirect(302, authorizationUrl);
  }

  return json({ error: "Unsupported SSO protocol" }, { status: 400 });
};
