import type { Context, Next } from "hono";

interface TokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

const AUTHORIZATION_URL = "https://api.notion.com/v1/oauth/authorize";
const TOKEN_URL = "https://api.notion.com/v1/oauth/token";
const SCOPES: string[] = [];
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
    client_id: env.NOTION_CLIENT_ID,
    redirect_uri: env.OAUTH2_REDIRECT_URI,
    response_type: "code",
    owner: "user",
    state,
  });

  return `${AUTHORIZATION_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  env: Record<string, string>,
  code: string,
): Promise<TokenResponse> {
  const body = {
    grant_type: "authorization_code",
    redirect_uri: env.OAUTH2_REDIRECT_URI,
    code,
  };

  // Notion uses Basic auth (client_id:client_secret) for token exchange
  const credentials = btoa(
    `${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`,
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
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
  // Notion doesn't support refresh tokens; tokens are long-lived
  // This is a placeholder for consistency with other adapters
  throw new Error("Notion does not support token refresh");
}
