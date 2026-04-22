function rowToConfig(row) {
  let defaultRoles;
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
    displayName: row.display_name ?? void 0,
    idpName: row.idp_name ?? void 0,
    samlEntityId: row.saml_entity_id ?? void 0,
    samlSsoUrl: row.saml_sso_url ?? void 0,
    samlSloUrl: row.saml_slo_url ?? void 0,
    samlCertificate: row.saml_certificate ?? void 0,
    samlMetadataUrl: row.saml_metadata_url ?? void 0,
    samlNameIdFormat: row.saml_name_id_format ?? void 0,
    oidcIssuer: row.oidc_issuer ?? void 0,
    oidcClientId: row.oidc_client_id ?? void 0,
    oidcClientSecret: row.oidc_client_secret ?? void 0,
    oidcAuthorizationUrl: row.oidc_authorization_url ?? void 0,
    oidcTokenUrl: row.oidc_token_url ?? void 0,
    oidcUserinfoUrl: row.oidc_userinfo_url ?? void 0,
    oidcJwksUrl: row.oidc_jwks_url ?? void 0,
    oidcScopes: row.oidc_scopes ?? void 0,
    jitProvisioning: row.jit_provisioning === 1,
    defaultRoles,
    forceSso: row.force_sso === 1,
    ssoBypassMfa: row.sso_bypass_mfa === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function generatePKCE() {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  const codeVerifier = base64UrlEncode(buffer);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = base64UrlEncode(new Uint8Array(digest));
  return { codeVerifier, codeChallenge };
}
async function buildAuthorizationUrl(config, redirectUri, state, codeChallenge) {
  const authUrl = config.oidcAuthorizationUrl || `${config.oidcIssuer}/authorize`;
  const scopes = config.oidcScopes || "openid email profile";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.oidcClientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    nonce: crypto.randomUUID()
  });
  return `${authUrl}?${params.toString()}`;
}
async function processOidcCallback(code, config, redirectUri, codeVerifier) {
  const tokenUrl = config.oidcTokenUrl || `${config.oidcIssuer}/oauth/token`;
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: config.oidcClientId,
    code_verifier: codeVerifier
  });
  if (config.oidcClientSecret) {
    tokenBody.set("client_secret", config.oidcClientSecret);
  }
  let tokenData;
  try {
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString()
    });
    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      return { success: false, error: `Token exchange failed: ${tokenRes.status} ${errBody}` };
    }
    tokenData = await tokenRes.json();
  } catch (e) {
    return { success: false, error: `Token exchange request failed: ${e}` };
  }
  if (!tokenData.access_token) {
    return { success: false, error: "No access_token in token response" };
  }
  let identity = null;
  if (tokenData.id_token) {
    identity = parseIdTokenClaims(tokenData.id_token);
  }
  if (!identity?.email) {
    const userinfoIdentity = await fetchUserInfo(config, tokenData.access_token);
    if (userinfoIdentity) {
      identity = mergeIdentities(identity, userinfoIdentity);
    }
  }
  if (!identity?.email) {
    return { success: false, error: "Could not determine user email from OIDC response" };
  }
  return { success: true, identity };
}
async function discoverOidcEndpoints(issuer) {
  const wellKnownUrl = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
  try {
    const res = await fetch(wellKnownUrl);
    if (!res.ok)
      return null;
    return await res.json();
  } catch {
    return null;
  }
}
function parseIdTokenClaims(idToken) {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3)
      return null;
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    const email = payload.email || payload.upn;
    if (!email)
      return null;
    return {
      email: email.toLowerCase(),
      nameId: payload.sub,
      displayName: payload.name || void 0,
      firstName: payload.given_name || void 0,
      lastName: payload.family_name || void 0,
      groups: Array.isArray(payload.groups) ? payload.groups : void 0
    };
  } catch {
    return null;
  }
}
async function fetchUserInfo(config, accessToken) {
  const userinfoUrl = config.oidcUserinfoUrl || `${config.oidcIssuer}/userinfo`;
  try {
    const res = await fetch(userinfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok)
      return null;
    const data = await res.json();
    const email = data.email || data.upn;
    if (!email)
      return null;
    return {
      email: email.toLowerCase(),
      nameId: data.sub,
      displayName: data.name || void 0,
      firstName: data.given_name || void 0,
      lastName: data.family_name || void 0,
      groups: Array.isArray(data.groups) ? data.groups : void 0
    };
  } catch {
    return null;
  }
}
function mergeIdentities(a, b) {
  if (!a)
    return b;
  return {
    email: a.email || b.email,
    nameId: a.nameId || b.nameId,
    displayName: a.displayName || b.displayName,
    firstName: a.firstName || b.firstName,
    lastName: a.lastName || b.lastName,
    groups: a.groups || b.groups,
    rawAttributes: { ...b.rawAttributes, ...a.rawAttributes }
  };
}
function base64UrlEncode(data) {
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

export { buildAuthorizationUrl as b, discoverOidcEndpoints as d, generatePKCE as g, processOidcCallback as p, rowToConfig as r };
//# sourceMappingURL=oidc-BYrCjpBS.js.map
