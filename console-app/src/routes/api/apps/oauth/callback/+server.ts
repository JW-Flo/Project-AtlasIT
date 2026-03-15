import type { RequestHandler } from "@sveltejs/kit";
import {
  getCredentials,
  saveOAuthTokens,
  saveCredentials,
} from "$lib/server/credentials";
import { oauthProviders, getOAuthClientCreds } from "$lib/server/oauth-configs";

/**
 * OAuth callback handler.
 * Exchanges the authorization code for tokens using platform client
 * credentials (from wrangler secrets), then stores the resulting
 * workspace-scoped tokens in D1.
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

  let oauthState: { state: string; appId: string; tenantId?: string };
  try {
    oauthState = JSON.parse(raw);
  } catch {
    return redirectToMarketplace("Invalid OAuth state");
  }

  if (oauthState.state !== state) {
    return redirectToMarketplace("OAuth state mismatch. Try again.");
  }

  const appId = oauthState.appId;
  const tenantId = oauthState.tenantId;
  if (!tenantId) {
    return redirectToMarketplace("Tenant context required. Please try again.");
  }
  cookies.delete("oauth_state", { path: "/" });

  const provider = oauthProviders[appId];
  if (!provider) return redirectToMarketplace(`Unknown provider: ${appId}`);

  // Get client credentials from wrangler secrets (NOT from tenant D1)
  const env = (platform?.env as Record<string, unknown>) || {};
  const clientCreds = getOAuthClientCreds(env, provider);
  if (!clientCreds) {
    return redirectToMarketplace(
      `OAuth not configured: missing ${provider.envPrefix}_CLIENT_ID secret`,
    );
  }

  // For tenant_domain apps, resolve template vars in token URL
  let tokenUrl = provider.tokenUrl;
  if (provider.model === "tenant_domain") {
    const tenantCreds = await getCredentials(platform, appId, tenantId);
    if (tenantCreds?.domain)
      tokenUrl = tokenUrl.replace("{domain}", tenantCreds.domain);
    if (tenantCreds?.tenant_url)
      tokenUrl = tokenUrl.replace("{tenant_url}", tenantCreds.tenant_url);
  }

  const origin = url.origin;
  const redirectUri = `${origin}/api/apps/oauth/callback`;

  // Exchange code for tokens using platform client credentials
  const tokenBody: Record<string, string> = {
    client_id: clientCreds.clientId,
    client_secret: clientCreds.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  let tokenRes: Response;
  try {
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
    tokenData.access_token || tokenData.authed_user?.access_token;

  if (!accessToken) {
    return redirectToMarketplace(
      `No access_token in response: ${JSON.stringify(tokenData).substring(0, 200)}`,
    );
  }

  // Store the workspace-scoped OAuth tokens in D1 (encrypted)
  await saveOAuthTokens(
    platform,
    appId,
    {
      access_token: accessToken,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || "Bearer",
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      raw: tokenData,
    },
    tenantId,
  );

  // Ensure app is marked as connected
  const existingCreds = (await getCredentials(platform, appId, tenantId)) || {};
  await saveCredentials(platform, appId, existingCreds, tenantId);

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
