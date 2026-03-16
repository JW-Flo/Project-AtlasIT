/**
 * OIDC Exchange Worker — Production-hardened
 *
 * Accepts a GitHub Actions OIDC id_token, validates it against GitHub's
 * JWKS, checks repo/org allowlists, and exchanges it for a short-lived
 * 1Password Connect token.
 */

interface Env {
  OP_CONNECT_HOST: string;
  /** Comma-separated list of allowed GitHub repos (e.g. "JW-Flo/Project-AtlasIT,JW-Flo/infra") */
  ALLOWED_REPOS: string;
  /** Optional: comma-separated list of allowed GitHub orgs */
  ALLOWED_ORGS?: string;
  /** KV namespace for rate limiting */
  RATE_LIMIT_KV: KVNamespace;
  /** Max requests per IP per minute (default: 10) */
  RATE_LIMIT_RPM?: string;
}

interface GitHubOIDCClaims {
  iss: string;
  sub: string;
  aud: string;
  repository: string;
  repository_owner: string;
  ref: string;
  sha: string;
  workflow: string;
  run_id: string;
  run_number: string;
  actor: string;
  event_name: string;
  exp: number;
  iat: number;
  nbf: number;
}

interface JWK {
  kty: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
  use: string;
}

interface JWKS {
  keys: JWK[];
}

const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`;

// JWKS cache (in-memory, per-isolate)
let jwksCache: { keys: JWKS; fetchedAt: number } | null = null;
const JWKS_CACHE_TTL_MS = 3600_000; // 1 hour

function jsonError(message: string, status: number, detail?: string): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...(detail ? { detail } : {}),
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  maxRpm: number,
): Promise<boolean> {
  const key = `rl:oidc:${ip}`;
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= maxRpm) {
    return false;
  }

  await kv.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}

async function fetchJWKS(): Promise<JWKS> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.keys;
  }

  const resp = await fetch(GITHUB_JWKS_URL);
  if (!resp.ok) {
    throw new Error(`Failed to fetch GitHub JWKS: ${resp.status}`);
  }

  const keys = (await resp.json()) as JWKS;
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importJWK(jwk: JWK): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
      alg: jwk.alg,
      ext: true,
    },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

async function verifyGitHubJWT(token: string): Promise<GitHubOIDCClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const headerJson = new TextDecoder().decode(base64UrlDecode(parts[0]));
  const header = JSON.parse(headerJson) as { kid: string; alg: string };

  if (header.alg !== "RS256") {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  const jwks = await fetchJWKS();
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    // Refresh JWKS cache on key miss (key rotation)
    jwksCache = null;
    const refreshed = await fetchJWKS();
    const retryJwk = refreshed.keys.find((k) => k.kid === header.kid);
    if (!retryJwk) {
      throw new Error(`Unknown key ID: ${header.kid}`);
    }
    return verifyWithKey(token, parts, retryJwk);
  }

  return verifyWithKey(token, parts, jwk);
}

async function verifyWithKey(
  _token: string,
  parts: string[],
  jwk: JWK,
): Promise<GitHubOIDCClaims> {
  const key = await importJWK(jwk);
  const signatureInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlDecode(parts[2]);

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    signatureInput,
  );

  if (!valid) {
    throw new Error("Invalid JWT signature");
  }

  const payloadJson = new TextDecoder().decode(base64UrlDecode(parts[1]));
  const claims = JSON.parse(payloadJson) as GitHubOIDCClaims;

  // Validate standard claims
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now) {
    throw new Error("Token expired");
  }
  if (claims.nbf && claims.nbf > now + 30) {
    throw new Error("Token not yet valid");
  }
  if (claims.iss !== GITHUB_OIDC_ISSUER) {
    throw new Error(`Invalid issuer: ${claims.iss}`);
  }

  return claims;
}

function isRepoAllowed(repo: string, allowedRepos: string): boolean {
  const list = allowedRepos
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  return list.includes(repo);
}

function isOrgAllowed(
  owner: string,
  allowedOrgs: string | undefined,
): boolean {
  if (!allowedOrgs) return true; // No org restriction
  const list = allowedOrgs
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return list.includes(owner);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only POST /exchange
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (request.method !== "POST" || url.pathname !== "/exchange") {
      return jsonError("Not Found", 404);
    }

    // Rate limiting
    const clientIP = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const maxRpm = parseInt(env.RATE_LIMIT_RPM ?? "10", 10);
    const allowed = await checkRateLimit(env.RATE_LIMIT_KV, clientIP, maxRpm);
    if (!allowed) {
      return jsonError("Rate limit exceeded", 429);
    }

    // Validate config
    if (!env.OP_CONNECT_HOST) {
      return jsonError("Server configuration error", 500, "OP_CONNECT_HOST not configured");
    }
    if (!env.ALLOWED_REPOS) {
      return jsonError("Server configuration error", 500, "ALLOWED_REPOS not configured");
    }

    // Parse request
    let body: { id_token?: string };
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    if (!body.id_token || typeof body.id_token !== "string") {
      return jsonError("Missing or invalid id_token", 400);
    }

    // Validate GitHub OIDC JWT
    let claims: GitHubOIDCClaims;
    try {
      claims = await verifyGitHubJWT(body.id_token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "JWT verification failed";
      return jsonError("Unauthorized", 401, message);
    }

    // Check repo allowlist
    if (!isRepoAllowed(claims.repository, env.ALLOWED_REPOS)) {
      return jsonError(
        "Forbidden",
        403,
        `Repository ${claims.repository} is not authorized`,
      );
    }

    // Check org allowlist
    if (!isOrgAllowed(claims.repository_owner, env.ALLOWED_ORGS)) {
      return jsonError(
        "Forbidden",
        403,
        `Organization ${claims.repository_owner} is not authorized`,
      );
    }

    // Exchange with 1Password Connect
    try {
      const resp = await fetch(`${env.OP_CONNECT_HOST}/v1/auth/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: body.id_token }),
      });

      const data = await resp.text();
      return new Response(data, {
        status: resp.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Exchange failed";
      return jsonError("Exchange failed", 502, message);
    }
  },
};
