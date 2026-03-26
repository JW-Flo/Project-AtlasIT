import type { Context, Next } from "hono";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

const AUTHORIZATION_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const SCOPES = [
  "User.ReadWrite.All",
  "Group.ReadWrite.All",
  "Directory.ReadWrite.All",
  "Organization.Read.All",
];
const PKCE_ENABLED = true;

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

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function getAuthorizationUrl(
  env: Record<string, string>,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: env.MICROSOFT_CLIENT_ID,
    redirect_uri: env.OAUTH2_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  });

  if (PKCE_ENABLED) {
    // In production, generate and store code_verifier per request
    params.set("code_challenge_method", "S256");
  }

  return `${AUTHORIZATION_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  env: Record<string, string>,
  code: string,
  codeVerifier?: string,
): Promise<TokenResponse> {
  const body: Record<string, string> = {
    grant_type: "authorization_code",
    client_id: env.MICROSOFT_CLIENT_ID,
    client_secret: env.MICROSOFT_CLIENT_SECRET,
    redirect_uri: env.OAUTH2_REDIRECT_URI,
    code,
  };

  if (PKCE_ENABLED && codeVerifier) {
    body.code_verifier = codeVerifier;
  }

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
      client_id: env.MICROSOFT_CLIENT_ID,
      client_secret: env.MICROSOFT_CLIENT_SECRET,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<TokenResponse>;
}
