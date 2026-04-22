import { queryPgOne } from './pg-BHX2Ay11.js';
import { g as getOAuthClientCreds, o as oauthProviders } from './oauth-configs-DUOp3AT9.js';
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

function resolveEncryptionKey(env, operation) {
  if (env.CRED_ENCRYPTION_KEY) {
    return env.CRED_ENCRYPTION_KEY;
  }
  const isDev = (env.NODE_ENV ?? "").toLowerCase() === "development";
  if (isDev) {
    console.warn(
      `[credentials] ${operation}: CRED_ENCRYPTION_KEY not set — using plaintext (dev mode only)`
    );
    return null;
  }
  throw new Error(`[credentials] ${operation}: CRED_ENCRYPTION_KEY required in production`);
}
async function deriveKey(secret) {
  const raw = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
async function decrypt(ciphertext, secret) {
  const key = await deriveKey(secret);
  const [ivHex, ctHex] = ciphertext.split(":");
  if (!ivHex || !ctHex) throw new Error("Malformed ciphertext");
  const iv = fromHex(ivHex);
  const ct = fromHex(ctHex);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}
async function getCredentialsPg(env, appId, tenantId) {
  if (!tenantId) return null;
  const row = await queryPgOne(
    "SELECT credentials FROM app_credentials WHERE tenant_id = $1 AND app_id = $2",
    [tenantId, appId]
  );
  if (!row) return null;
  const encKey = resolveEncryptionKey(env, "read");
  const json = encKey ? await decrypt(row.credentials, encKey) : row.credentials;
  return JSON.parse(json);
}
const GET = async ({ url, platform, cookies, locals }) => {
  const user = locals.user;
  if (!user) {
    return jsonError("Unauthorized", 401);
  }
  const tenantId = user.tenantId;
  if (!tenantId) {
    return jsonError("Tenant context required", 403);
  }
  const appId = url.searchParams.get("appId");
  if (!appId) {
    return jsonError("appId query param required", 400);
  }
  const provider = oauthProviders[appId];
  if (!provider) {
    return jsonError(`No OAuth config for ${appId}`, 400);
  }
  const env = platform?.env || {};
  const clientCreds = getOAuthClientCreds(env, provider);
  if (!clientCreds) {
    return jsonError(
      `OAuth not configured for ${appId}. Missing ${provider.envPrefix}_CLIENT_ID / ${provider.envPrefix}_CLIENT_SECRET secrets.`,
      500
    );
  }
  let tenantCreds = null;
  if (provider.model === "tenant_domain") {
    tenantCreds = await getCredentialsPg(env, appId, tenantId);
    if (!tenantCreds?.domain && !tenantCreds?.tenant_url) {
      return jsonError(
        `${appId} requires your organization's domain. Please enter it in the marketplace first.`,
        400
      );
    }
  }
  const origin = url.origin;
  const redirectUri = `${origin}/api/apps/oauth/callback`;
  const state = crypto.randomUUID();
  cookies.set("oauth_state", JSON.stringify({ state, appId, tenantId }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600
  });
  let authorizeUrl = provider.authorizeUrl;
  if (tenantCreds?.domain) authorizeUrl = authorizeUrl.replace("{domain}", tenantCreds.domain);
  if (tenantCreds?.tenant_url)
    authorizeUrl = authorizeUrl.replace("{tenant_url}", tenantCreds.tenant_url);
  const params = new URLSearchParams({
    client_id: clientCreds.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    ...provider.scopes.length > 0 ? { scope: provider.scopes.join(" ") } : {},
    ...provider.extraParams || {}
  });
  if (appId === "slack") {
    params.delete("scope");
    params.set("user_scope", provider.scopes.join(","));
  }
  const fullUrl = `${authorizeUrl}?${params.toString()}`;
  return new Response(null, {
    status: 302,
    headers: { Location: fullUrl }
  });
};
function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export { GET };
//# sourceMappingURL=_server.ts-Dko9vQyK.js.map
