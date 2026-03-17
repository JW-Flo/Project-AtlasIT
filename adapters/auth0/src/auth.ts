import type { Context, Next } from "hono";
import type { TokenResponse } from "./types.js";

const SCOPES = [
  "read:users",
  "read:organizations",
  "read:organization_members",
];

export async function authMiddleware(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  await next();
}

export async function getClientCredentialsToken(
  domain: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse> {
  const tokenUrl = `https://${domain}/oauth/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: "client_credentials",
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Auth0 token exchange failed (${response.status}): ${error}`,
    );
  }

  return response.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(
  domain: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<TokenResponse> {
  const tokenUrl = `https://${domain}/oauth/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Auth0 token refresh failed (${response.status}): ${error}`,
    );
  }

  return response.json() as Promise<TokenResponse>;
}

export { SCOPES };
