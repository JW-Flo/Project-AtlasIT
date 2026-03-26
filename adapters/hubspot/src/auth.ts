import type { Context, Next } from "hono";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

const AUTHORIZATION_URL = "https://app.hubspot.com/oauth/authorize";
const TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";
const SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
  "crm.lists.read",
  "crm.lists.write",
];
const PKCE_ENABLED = false;

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

export function getAuthorizationUrl(
  env: Record<string, string>,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: env.HUBSPOT_CLIENT_ID,
    redirect_uri: env.OAUTH2_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  });

  return `${AUTHORIZATION_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  env: Record<string, string>,
  code: string,
): Promise<TokenResponse> {
  const body: Record<string, string> = {
    grant_type: "authorization_code",
    client_id: env.HUBSPOT_CLIENT_ID,
    client_secret: env.HUBSPOT_CLIENT_SECRET,
    redirect_uri: env.OAUTH2_REDIRECT_URI,
    code,
  };

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(
  env: Record<string, string>,
  refreshToken: string,
): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.HUBSPOT_CLIENT_ID,
      client_secret: env.HUBSPOT_CLIENT_SECRET,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<TokenResponse>;
}
