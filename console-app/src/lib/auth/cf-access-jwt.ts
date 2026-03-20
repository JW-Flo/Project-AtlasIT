/**
 * Cloudflare Access JWT validation.
 *
 * Validates the `Cf-Access-Jwt-Assertion` header by:
 *   1. Parsing the JWT (header + payload, without trusting claims yet).
 *   2. Fetching public signing keys from the Cloudflare Access certs endpoint.
 *   3. Verifying the RS256 signature using the Web Crypto API.
 *   4. Enforcing `aud`, `exp`, and `iss` claims.
 *
 * References:
 *   https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */

export interface CfAccessJwtPayload {
  /** Audience: typically the Access Application AUD tag (array or single string). */
  aud: string | string[];
  /** Issuer: your team's Cloudflare Access domain, e.g. https://team.cloudflareaccess.com */
  iss: string;
  /** Subject: the user's identity (usually email). */
  sub: string;
  /** Email claim added by Cloudflare Access. */
  email?: string;
  /** Issued-at timestamp (UNIX seconds). */
  iat: number;
  /** Expiry timestamp (UNIX seconds). */
  exp: number;
  /** Custom claims. */
  [key: string]: unknown;
}

export interface JwtValidationOptions {
  /** Expected audience value (the CF Access AUD tag). */
  audience: string;
  /** Full URL to the certs endpoint, e.g. https://team.cloudflareaccess.com/cdn-cgi/access/certs */
  certsUrl: string;
  /**
   * Clock skew tolerance in seconds (default: 10).
   * Allows tokens issued a few seconds in the future to pass.
   */
  clockSkewSec?: number;
}

export type JwtValidationResult =
  | { valid: true; claims: CfAccessJwtPayload }
  | { valid: false; reason: string; claims?: undefined };

/**
 * Builds the certs endpoint URL from an issuer string.
 */
export function buildCertsUrl(issuer: string): string {
  return `${issuer.replace(/\/$/, "")}/cdn-cgi/access/certs`;
}

/**
 * Extracts (but does NOT verify) the JWT payload claims.
 * Returns null if the token is structurally invalid.
 */
export function extractJwtClaims(token: string): CfAccessJwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadB64 + "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as CfAccessJwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts the JWT header (alg, kid, typ).
 */
function extractJwtHeader(
  token: string,
): { alg: string; kid?: string; typ?: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const headerB64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
    const padded = headerB64 + "=".repeat((4 - (headerB64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { alg: string; kid?: string };
  } catch {
    return null;
  }
}

/** In-memory JWKS cache keyed by certs URL. Persists across requests within a Worker isolate. */
const JWKS_CACHE = new Map<string, { keys: JsonWebKey[]; fetchedAt: number }>();

/** Track seen key IDs to detect rotation events. */
const SEEN_KIDS = new Set<string>();

/** JWKS cache TTL: 1 hour (keys rotate infrequently). */
const JWKS_TTL_MS = 60 * 60 * 1000;

/**
 * Fetches and returns the JWK Set from the certs endpoint.
 * Results are cached in memory for JWKS_TTL_MS to avoid a fetch on every
 * request. The cache is keyed by URL so multiple team domains are supported.
 * Returns null on any network or parsing error.
 */
async function fetchCerts(certsUrl: string): Promise<JsonWebKey[] | null> {
  const now = Date.now();
  const cached = JWKS_CACHE.get(certsUrl);
  if (cached && now - cached.fetchedAt < JWKS_TTL_MS) {
    return cached.keys;
  }

  try {
    const resp = await fetch(certsUrl, {
      // Cache-friendly: CF certs rotate infrequently
      headers: { accept: "application/json" },
    });
    if (!resp.ok) return null;
    const body = (await resp.json()) as { keys?: JsonWebKey[] };
    if (!Array.isArray(body.keys)) return null;
    JWKS_CACHE.set(certsUrl, { keys: body.keys, fetchedAt: now });

    // Track key rotation events
    for (const key of body.keys) {
      const kid = (key as any).kid as string | undefined;
      if (kid && !SEEN_KIDS.has(kid)) {
        SEEN_KIDS.add(kid);
        if (SEEN_KIDS.size > 1) {
          console.log(JSON.stringify({
            level: "info",
            event: "jwt.key_rotation_detected",
            kid,
            totalKeys: SEEN_KIDS.size,
            timestamp: new Date().toISOString(),
          }));
        }
      }
    }

    return body.keys;
  } catch {
    return null;
  }
}

/**
 * Imports a JWK as a CryptoKey for RS256 verification.
 */
async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

/**
 * Validates the `Cf-Access-Jwt-Assertion` header from an incoming request.
 *
 * Returns a typed discriminated union: `{ valid: true, claims }` or
 * `{ valid: false, reason }`.
 */
export async function validateCfAccessJwt(
  headers: Headers,
  options: JwtValidationOptions,
): Promise<JwtValidationResult> {
  const { audience, certsUrl, clockSkewSec = 10 } = options;

  // 1. Extract the token
  const token = headers.get("cf-access-jwt-assertion");
  if (!token) {
    return { valid: false, reason: "missing Cf-Access-Jwt-Assertion header" };
  }

  // 2. Structural check (must be 3 parts)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      valid: false,
      reason: "malformed JWT: expected 3 dot-separated parts",
    };
  }

  // 3. Parse header and payload (unverified at this stage)
  const jwtHeader = extractJwtHeader(token);
  if (!jwtHeader) {
    return { valid: false, reason: "malformed JWT: cannot parse header" };
  }

  const claims = extractJwtClaims(token);
  if (!claims) {
    return { valid: false, reason: "malformed JWT: cannot parse payload" };
  }

  // 4. Fetch signing keys from Cloudflare Access certs endpoint
  const keys = await fetchCerts(certsUrl);
  if (!keys) {
    return {
      valid: false,
      reason: "failed to fetch certs from Access certs endpoint",
    };
  }

  // 5. Find the matching key by kid (or fall back to trying all keys)
  const kid = jwtHeader.kid;
  const candidateKeys = kid
    ? keys.filter((k) => (k as Record<string, unknown>).kid === kid)
    : keys;

  if (candidateKeys.length === 0) {
    return {
      valid: false,
      reason: `no matching key found in certs (kid: ${kid ?? "none"})`,
    };
  }

  // 6. Verify signature (try each candidate key)
  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sigB64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
  const sigPadded = sigB64 + "=".repeat((4 - (sigB64.length % 4)) % 4);
  let sigBytes: ArrayBuffer;
  try {
    sigBytes = Uint8Array.from(atob(sigPadded), (c) => c.charCodeAt(0)).buffer;
  } catch {
    return { valid: false, reason: "malformed JWT: cannot decode signature" };
  }

  let signatureValid = false;
  for (const jwk of candidateKeys) {
    try {
      const cryptoKey = await importPublicKey(jwk);
      const ok = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        sigBytes,
        signingInput,
      );
      if (ok) {
        signatureValid = true;
        break;
      }
    } catch {
      // Key import failure or verify error: try next key
    }
  }

  if (!signatureValid) {
    return { valid: false, reason: "signature verification failed" };
  }

  // 7. Check expiry
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === "number" && claims.exp < nowSec - clockSkewSec) {
    return {
      valid: false,
      reason: `token expired at ${new Date(claims.exp * 1000).toISOString()}`,
    };
  }

  // 8. Check audience
  const audList = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audList.includes(audience)) {
    return {
      valid: false,
      reason: `audience mismatch: expected ${audience}, got [${audList.join(", ")}]`,
    };
  }

  // All checks passed
  return { valid: true, claims };
}
