import { g as getCredentials, a as saveOAuthTokens, s as saveCredentials } from './credentials-CkBYNzQv.js';
import { g as getOAuthClientCreds, o as oauthProviders } from './oauth-configs-DUOp3AT9.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const GET = async ({ url, platform, cookies }) => {
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
  const raw = cookies.get("oauth_state");
  if (!raw) return redirectToMarketplace("OAuth state expired. Try again.");
  let oauthState;
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
  const env = platform?.env || {};
  const clientCreds = getOAuthClientCreds(env, provider);
  if (!clientCreds) {
    return redirectToMarketplace(
      `OAuth not configured: missing ${provider.envPrefix}_CLIENT_ID secret`
    );
  }
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
  const tokenBody = {
    client_id: clientCreds.clientId,
    client_secret: clientCreds.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  };
  let tokenRes;
  try {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded"
    };
    if (appId === "github") headers["Accept"] = "application/json";
    tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(tokenBody).toString()
    });
  } catch (e) {
    return redirectToMarketplace(`Token exchange failed: ${e}`);
  }
  let tokenData;
  try {
    tokenData = await tokenRes.json();
  } catch {
    return redirectToMarketplace(`Invalid token response from ${appId}`);
  }
  if (appId === "slack" && tokenData.ok === false) {
    return redirectToMarketplace(`Slack error: ${tokenData.error}`);
  }
  const accessToken = tokenData.access_token || tokenData.authed_user?.access_token;
  if (!accessToken) {
    return redirectToMarketplace(
      `No access_token in response: ${JSON.stringify(tokenData).substring(0, 200)}`
    );
  }
  await saveOAuthTokens(
    platform,
    appId,
    {
      access_token: accessToken,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || "Bearer",
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      raw: tokenData
    },
    tenantId
  );
  const existingCreds = await getCredentials(platform, appId, tenantId) || {};
  await saveCredentials(platform, appId, existingCreds, tenantId);
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (db) {
    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: "oauth_system",
        actorEmail: "oauth_system",
        action: "app.oauth_connected",
        targetType: "app",
        targetId: appId
      });
    } catch {
    }
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/console/integrations?connected=${appId}`
    }
  });
};
function redirectToMarketplace(error) {
  const encoded = encodeURIComponent(error);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/console/marketplace?error=${encoded}`
    }
  });
}

export { GET };
//# sourceMappingURL=_server.ts-DVGEoY0P.js.map
