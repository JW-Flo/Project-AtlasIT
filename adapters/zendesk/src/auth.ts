import type { TokenResponse } from "./types.js";

const SCOPES = [
  "users:read",
  "organizations:read",
];

export function getAuthorizationUrl(
  subdomain: string,
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  });

  return `https://${subdomain}.zendesk.com/oauth/authorizations/new?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  subdomain: string,
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const tokenUrl = `https://${subdomain}.zendesk.com/oauth/tokens`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Zendesk token exchange failed (${response.status}): ${error}`,
    );
  }

  return response.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(
  subdomain: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<TokenResponse> {
  const tokenUrl = `https://${subdomain}.zendesk.com/oauth/tokens`;

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
      `Zendesk token refresh failed (${response.status}): ${error}`,
    );
  }

  return response.json() as Promise<TokenResponse>;
}

export { SCOPES };
