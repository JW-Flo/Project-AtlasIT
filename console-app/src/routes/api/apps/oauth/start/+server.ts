import type { RequestHandler } from "@sveltejs/kit";
import { getCredentials } from "$lib/server/credentials";
import { oauthProviders, getOAuthClientCreds } from "$lib/server/oauth-configs";

/**
 * Initiates the OAuth authorization_code flow for a given app.
 *
 * For "platform" OAuth apps (Slack, GitHub, etc.): client ID/secret come from
 * wrangler secrets (e.g. SLACK_CLIENT_ID). Tenant doesn't provide anything.
 *
 * For "tenant_domain" apps (Okta, Auth0): client creds come from wrangler
 * secrets, but the tenant provides their domain in app_credentials so we can
 * build the correct authorize/token URLs.
 *
 * Usage: GET /api/apps/oauth/start?appId=slack
 */
export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  const appId = url.searchParams.get("appId");
  if (!appId) {
    return jsonError("appId query param required", 400);
  }

  const provider = oauthProviders[appId];
  if (!provider) {
    return jsonError(`No OAuth config for ${appId}`, 400);
  }

  // Get client credentials from wrangler secrets
  const env = (platform?.env as Record<string, unknown>) || {};
  const clientCreds = getOAuthClientCreds(env, provider);
  if (!clientCreds) {
    return jsonError(
      `OAuth not configured for ${appId}. Missing ${provider.envPrefix}_CLIENT_ID / ${provider.envPrefix}_CLIENT_SECRET secrets.`,
      500,
    );
  }

  // For tenant_domain apps, load the tenant's domain from D1
  let tenantCreds: Record<string, string> | null = null;
  if (provider.model === "tenant_domain") {
    tenantCreds = await getCredentials(platform, appId);
    if (!tenantCreds?.domain && !tenantCreds?.tenant_url) {
      return jsonError(
        `${appId} requires your organization's domain. Please enter it in the marketplace first.`,
        400,
      );
    }
  }

  // Build callback URL
  const origin = url.origin;
  const redirectUri = `${origin}/api/apps/oauth/callback`;

  // Generate CSRF state token
  const state = crypto.randomUUID();
  cookies.set("oauth_state", JSON.stringify({ state, appId }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // Resolve template vars in authorize URL for tenant-domain apps
  let authorizeUrl = provider.authorizeUrl;
  if (tenantCreds?.domain)
    authorizeUrl = authorizeUrl.replace("{domain}", tenantCreds.domain);
  if (tenantCreds?.tenant_url)
    authorizeUrl = authorizeUrl.replace("{tenant_url}", tenantCreds.tenant_url);

  // Build the full authorization URL
  const params = new URLSearchParams({
    client_id: clientCreds.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    ...(provider.scopes.length > 0 ? { scope: provider.scopes.join(" ") } : {}),
    ...(provider.extraParams || {}),
  });

  // Slack uses a different scope param name
  if (appId === "slack") {
    params.delete("scope");
    params.set("user_scope", provider.scopes.join(","));
  }

  const fullUrl = `${authorizeUrl}?${params.toString()}`;

  return new Response(null, {
    status: 302,
    headers: { Location: fullUrl },
  });
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
