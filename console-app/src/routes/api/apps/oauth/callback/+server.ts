import type { RequestHandler } from "@sveltejs/kit";
import {
  getCredentials,
  saveOAuthTokens,
  saveCredentials,
} from "$lib/server/credentials";
import { oauthProviders } from "$lib/server/oauth-configs";

/**
 * OAuth callback handler.
 * Exchanges the authorization code for tokens and stores them in D1.
 *
 * The provider redirects here: GET /api/apps/oauth/callback?code=xxx&state=yyy
 */
export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    const desc = url.searchParams.get("error_description") || error;
    return redirectToMarketplace(`OAuth error: ${desc}`);
  }

  if (!code || !state) {
    return redirectToMarketplace("Missing code or state parameter");
  }

  // Validate CSRF state
  const raw = cookies.get("oauth_state");
  if (!raw) return redirectToMarketplace("OAuth state expired. Try again.");

  let oauthState: { state: string; appId: string };
  try {
    oauthState = JSON.parse(raw);
  } catch {
    return redirectToMarketplace("Invalid OAuth state");
  }

  if (oauthState.state !== state) {
    return redirectToMarketplace("OAuth state mismatch. Try again.");
  }

  const appId = oauthState.appId;
  cookies.delete("oauth_state", { path: "/" });

  const provider = oauthProviders[appId];
  if (!provider) return redirectToMarketplace(`Unknown provider: ${appId}`);

  // Get client credentials from D1
  const creds = await getCredentials(platform, appId);
  if (!creds?.client_id || !creds?.client_secret) {
    return redirectToMarketplace(
      "Missing client credentials for token exchange",
    );
  }

  // Resolve template vars in token URL
  let tokenUrl = provider.tokenUrl;
  if (creds.domain) tokenUrl = tokenUrl.replace("{domain}", creds.domain);
  if (creds.tenant_url)
    tokenUrl = tokenUrl.replace("{tenant_url}", creds.tenant_url);
  if (creds.tenant_id)
    tokenUrl = tokenUrl.replace("{tenantId}", creds.tenant_id);

  const origin = url.origin;
  const redirectUri = `${origin}/api/apps/oauth/callback`;

  // Exchange code for tokens
  const tokenBody: Record<string, string> = {
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  let tokenRes: Response;
  try {
    // GitHub expects Accept: application/json
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (appId === "github") headers["Accept"] = "application/json";

    tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(tokenBody).toString(),
    });
  } catch (e) {
    return redirectToMarketplace(`Token exchange failed: ${e}`);
  }

  let tokenData: any;
  try {
    tokenData = await tokenRes.json();
  } catch {
    return redirectToMarketplace(`Invalid token response from ${appId}`);
  }

  // Slack returns { ok: true, access_token: ... } or { ok: false, error: ... }
  if (appId === "slack" && tokenData.ok === false) {
    return redirectToMarketplace(`Slack error: ${tokenData.error}`);
  }

  // Standard OAuth: check for access_token
  const accessToken =
    tokenData.access_token || tokenData.authed_user?.access_token; // Slack v2 format

  if (!accessToken) {
    return redirectToMarketplace(
      `No access_token in response: ${JSON.stringify(tokenData).substring(0, 200)}`,
    );
  }

  // Store the OAuth tokens in D1 (encrypted)
  await saveOAuthTokens(platform, appId, {
    access_token: accessToken,
    refresh_token: tokenData.refresh_token,
    token_type: tokenData.token_type || "Bearer",
    expires_in: tokenData.expires_in,
    scope: tokenData.scope,
    raw: tokenData,
  });

  // Ensure app is marked as connected (in case they went straight to OAuth)
  const existingCreds = (await getCredentials(platform, appId)) || {};
  await saveCredentials(platform, appId, existingCreds);

  // Redirect to marketplace with success
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/console/integrations?connected=${appId}`,
    },
  });
};

function redirectToMarketplace(error: string): Response {
  const encoded = encodeURIComponent(error);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/console/marketplace?error=${encoded}`,
    },
  });
}
