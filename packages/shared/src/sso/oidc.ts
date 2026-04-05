/**
 * OpenID Connect Relying Party (RP) implementation.
 * Authorization Code flow with PKCE.
 * Uses Web Crypto API exclusively — runs on Cloudflare Workers.
 */

import type { SSOConfiguration, SSOIdentity, SSOCallbackResult } from "./types";

/**
 * Generate PKCE code_verifier and code_challenge.
 */
export async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  const codeVerifier = base64UrlEncode(buffer);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  const codeChallenge = base64UrlEncode(new Uint8Array(digest));

  return { codeVerifier, codeChallenge };
}

/**
 * Build the authorization URL for the OIDC IdP.
 */
export async function buildAuthorizationUrl(
  config: SSOConfiguration,
  redirectUri: string,
  state: string,
  codeChallenge: string,
): Promise<string> {
  const authUrl = config.oidcAuthorizationUrl || `${config.oidcIssuer}/authorize`;
  const scopes = config.oidcScopes || "openid email profile";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.oidcClientId!,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    nonce: crypto.randomUUID(),
  });

  return `${authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens and extract identity.
 */
export async function processOidcCallback(
  code: string,
  config: SSOConfiguration,
  redirectUri: string,
  codeVerifier: string,
): Promise<SSOCallbackResult> {
  const tokenUrl = config.oidcTokenUrl || `${config.oidcIssuer}/oauth/token`;

  // Token exchange
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: config.oidcClientId!,
    code_verifier: codeVerifier,
  });

  // Add client_secret if configured (some IdPs require it even with PKCE)
  if (config.oidcClientSecret) {
    tokenBody.set("client_secret", config.oidcClientSecret);
  }

  let tokenData: TokenResponse;
  try {
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      return { success: false, error: `Token exchange failed: ${tokenRes.status} ${errBody}` };
    }

    tokenData = (await tokenRes.json()) as TokenResponse;
  } catch (e) {
    return { success: false, error: `Token exchange request failed: ${e}` };
  }

  if (!tokenData.access_token) {
    return { success: false, error: "No access_token in token response" };
  }

  // Extract identity from id_token claims if present
  let identity: SSOIdentity | null = null;

  if (tokenData.id_token) {
    identity = parseIdTokenClaims(tokenData.id_token);
  }

  // Fall back to / supplement with userinfo endpoint
  if (!identity?.email) {
    const userinfoIdentity = await fetchUserInfo(
      config,
      tokenData.access_token,
    );
    if (userinfoIdentity) {
      identity = mergeIdentities(identity, userinfoIdentity);
    }
  }

  if (!identity?.email) {
    return { success: false, error: "Could not determine user email from OIDC response" };
  }

  return { success: true, identity };
}

/**
 * Discover OIDC endpoints from the issuer's well-known configuration.
 */
export async function discoverOidcEndpoints(
  issuer: string,
): Promise<OIDCDiscoveryDocument | null> {
  const wellKnownUrl = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
  try {
    const res = await fetch(wellKnownUrl);
    if (!res.ok) return null;
    return (await res.json()) as OIDCDiscoveryDocument;
  } catch {
    return null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface OIDCDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  subject_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse the payload of a JWT id_token without signature verification.
 * Signature verification is implicitly handled because the token was received
 * directly from the token endpoint over TLS (per OIDC spec, section 3.1.3.7).
 */
function parseIdTokenClaims(idToken: string): SSOIdentity | null {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      decodeBase64Url(parts[1]),
    ) as Record<string, unknown>;

    const email = (payload.email as string) || (payload.upn as string);
    if (!email) return null;

    return {
      email: email.toLowerCase(),
      nameId: payload.sub as string,
      displayName: (payload.name as string) || undefined,
      firstName: (payload.given_name as string) || undefined,
      lastName: (payload.family_name as string) || undefined,
      groups: Array.isArray(payload.groups)
        ? (payload.groups as string[])
        : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchUserInfo(
  config: SSOConfiguration,
  accessToken: string,
): Promise<SSOIdentity | null> {
  const userinfoUrl =
    config.oidcUserinfoUrl || `${config.oidcIssuer}/userinfo`;

  try {
    const res = await fetch(userinfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    const email = (data.email as string) || (data.upn as string);
    if (!email) return null;

    return {
      email: email.toLowerCase(),
      nameId: data.sub as string,
      displayName: (data.name as string) || undefined,
      firstName: (data.given_name as string) || undefined,
      lastName: (data.family_name as string) || undefined,
      groups: Array.isArray(data.groups)
        ? (data.groups as string[])
        : undefined,
    };
  } catch {
    return null;
  }
}

function mergeIdentities(
  a: SSOIdentity | null,
  b: SSOIdentity,
): SSOIdentity {
  if (!a) return b;
  return {
    email: a.email || b.email,
    nameId: a.nameId || b.nameId,
    displayName: a.displayName || b.displayName,
    firstName: a.firstName || b.firstName,
    lastName: a.lastName || b.lastName,
    groups: a.groups || b.groups,
    rawAttributes: { ...b.rawAttributes, ...a.rawAttributes },
  };
}

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}
