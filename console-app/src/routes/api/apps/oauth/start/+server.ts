import type { RequestHandler } from "@sveltejs/kit";
import { getCredentials } from "$lib/server/credentials";
import { oauthProviders } from "$lib/server/oauth-configs";

/**
 * Initiates the OAuth authorization_code flow for a given app.
 * Reads client_id from stored credentials, builds the authorize URL,
 * and redirects the user to the provider.
 *
 * Usage: GET /api/apps/oauth/start?appId=slack
 */
export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  const appId = url.searchParams.get("appId");
  if (!appId) {
    return new Response(
      JSON.stringify({ error: "appId query param required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const provider = oauthProviders[appId];
  if (!provider) {
    return new Response(
      JSON.stringify({ error: `No OAuth config for ${appId}` }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Get stored credentials to find client_id
  const creds = await getCredentials(platform, appId);
  const clientId = creds?.client_id;
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "No client_id found. Save credentials first." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
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
    maxAge: 600, // 10 min
  });

  // Resolve template vars in authorize URL (e.g. {domain})
  let authorizeUrl = provider.authorizeUrl;
  if (creds.domain)
    authorizeUrl = authorizeUrl.replace("{domain}", creds.domain);
  if (creds.tenant_url)
    authorizeUrl = authorizeUrl.replace("{tenant_url}", creds.tenant_url);
  if (creds.tenant_id)
    authorizeUrl = authorizeUrl.replace("{tenantId}", creds.tenant_id);

  // Build the full authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
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
