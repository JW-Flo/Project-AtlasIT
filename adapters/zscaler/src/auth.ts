import type { Context, Next } from "hono";
import type { Bindings, ZscalerTokenResponse } from "./types.js";

const TOKEN_CACHE_TTL_SECONDS = 3500; // Slightly under typical 1-hour expiry

/**
 * Fetch an OAuth2 client_credentials token from ZIdentity and cache it in KV.
 * Cache key is scoped to the vanity domain + cloud to support multi-tenant use.
 */
export async function getZscalerToken(
  clientId: string,
  clientSecret: string,
  vanityDomain: string,
  cloud: string,
  kv: KVNamespace,
): Promise<string> {
  const cacheKey = `zscaler:token:${vanityDomain}.${cloud}`;

  // Check KV cache first
  const cached = await kv.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh token
  const tokenUrl = `https://${vanityDomain}.${cloud}/api/v1/auth/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Zscaler OAuth token fetch failed: ${res.status} ${text}`,
    );
  }

  const data = (await res.json()) as ZscalerTokenResponse;
  const token = data.access_token;

  // Store in KV with TTL
  await kv.put(cacheKey, token, { expirationTtl: TOKEN_CACHE_TTL_SECONDS });

  return token;
}

/**
 * Build the Zscaler API base URL from vanity domain and cloud.
 */
export function buildBaseUrl(vanityDomain: string, cloud: string): string {
  return `https://${vanityDomain}.${cloud}`;
}

/**
 * Create an authenticated fetch wrapper that injects the Bearer token.
 */
export function createZscalerFetch(token: string): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  };
}

/**
 * Auth middleware — requires Authorization: Bearer <token> on /api/* routes.
 * The bearer token here is the AtlasIT internal service token (not Zscaler token).
 */
export async function authMiddleware(
  c: Context<{ Bindings: Bindings }>,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  await next();
}
