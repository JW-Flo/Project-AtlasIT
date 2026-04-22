import { json, redirect } from '@sveltejs/kit';
import { r as rowToConfig, g as generatePKCE, b as buildAuthorizationUrl } from './oidc-BYrCjpBS.js';
import { b as buildAuthnRequestUrl } from './saml-ndSwh4nV.js';

const SSO_STATE_TTL_SECONDS = 600;
const GET = async ({ url, platform }) => {
  const tenantId = url.searchParams.get("tenant");
  if (!tenantId) {
    return json({ error: "tenant parameter required" }, { status: 400 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  let config;
  try {
    const row = await db.prepare("SELECT * FROM sso_configurations WHERE tenant_id = ? AND enabled = 1 LIMIT 1").bind(tenantId).first();
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
  const now = /* @__PURE__ */ new Date();
  const expiresAt = new Date(now.getTime() + SSO_STATE_TTL_SECONDS * 1e3).toISOString();
  if (config.protocol === "saml") {
    const spEntityId = `${origin}/api/auth/sso/metadata`;
    const acsUrl = callbackUrl;
    try {
      await db.prepare(
        `INSERT INTO sso_auth_state (id, tenant_id, protocol, state, redirect_url, created_at, expires_at)
           VALUES (?, ?, 'saml', ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), tenantId, state, "/console", now.toISOString(), expiresAt).run();
    } catch (e) {
      console.error("Failed to store SSO state:", e);
    }
    let redirectUrl;
    try {
      redirectUrl = await buildAuthnRequestUrl(config, spEntityId, acsUrl, state);
    } catch (e) {
      console.error("Failed to build SAML AuthnRequest URL:", e);
      return json({ error: "Failed to initiate SSO — check SAML configuration" }, { status: 500 });
    }
    throw redirect(302, redirectUrl);
  }
  if (config.protocol === "oidc") {
    const { codeVerifier, codeChallenge } = await generatePKCE();
    try {
      await db.prepare(
        `INSERT INTO sso_auth_state (id, tenant_id, protocol, state, code_verifier, redirect_url, created_at, expires_at)
           VALUES (?, ?, 'oidc', ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        tenantId,
        state,
        codeVerifier,
        "/console",
        now.toISOString(),
        expiresAt
      ).run();
    } catch (e) {
      console.error("Failed to store SSO state:", e);
    }
    let authorizationUrl;
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

export { GET };
//# sourceMappingURL=_server.ts-BahLzxFQ.js.map
