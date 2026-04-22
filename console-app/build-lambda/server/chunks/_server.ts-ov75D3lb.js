import { json, redirect } from '@sveltejs/kit';
import { r as rowToConfig, p as processOidcCallback } from './oidc-BYrCjpBS.js';
import { p as processSamlResponse } from './saml-ndSwh4nV.js';
import { i as isMfaRequiredForUser, g as getSessionTtl, r as resolveSecurityPolicy } from './policies-DRfy6ccj.js';

const POST = async ({ request, url, platform, cookies }) => {
  return handleCallback("saml", request, url, platform, cookies);
};
const GET = async ({ request, url, platform, cookies }) => {
  return handleCallback("oidc", request, url, platform, cookies);
};
async function handleCallback(expectedProtocol, request, url, platform, cookies) {
  const db = platform?.env?.ATLAS_SHARED_DB;
  const kv = platform?.env?.KV_SESSIONS;
  if (!db || !kv) {
    return json({ error: "Service unavailable" }, { status: 503 });
  }
  let state = null;
  let samlResponseB64 = null;
  let code = null;
  if (expectedProtocol === "saml") {
    const formData = await request.formData().catch(() => null);
    samlResponseB64 = formData?.get("SAMLResponse");
    state = formData?.get("RelayState");
  } else {
    code = url.searchParams.get("code");
    state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    if (error) {
      const desc = url.searchParams.get("error_description") || error;
      throw redirect(302, `/console/login?error=sso_failed&message=${encodeURIComponent(desc)}`);
    }
  }
  if (!state) {
    throw redirect(302, "/console/login?error=sso_invalid_state");
  }
  let stateRow;
  try {
    stateRow = await db.prepare(
      "SELECT tenant_id, protocol, code_verifier, redirect_url FROM sso_auth_state WHERE state = ? AND expires_at > datetime('now')"
    ).bind(state).first();
    await db.prepare("DELETE FROM sso_auth_state WHERE state = ?").bind(state).run();
  } catch {
    throw redirect(302, "/console/login?error=sso_state_error");
  }
  if (!stateRow) {
    throw redirect(302, "/console/login?error=sso_expired");
  }
  if (stateRow.protocol !== expectedProtocol) {
    throw redirect(302, "/console/login?error=sso_protocol_mismatch");
  }
  const tenantId = stateRow.tenant_id;
  let config;
  try {
    const row = await db.prepare("SELECT * FROM sso_configurations WHERE tenant_id = ? AND enabled = 1 LIMIT 1").bind(tenantId).first();
    if (!row) throw new Error("No SSO config");
    config = rowToConfig(row);
  } catch {
    throw redirect(302, "/console/login?error=sso_config_missing");
  }
  let identity = null;
  if (config.protocol === "saml" && samlResponseB64) {
    const origin = url.origin;
    const spEntityId = `${origin}/api/auth/sso/metadata`;
    const acsUrl = `${origin}/api/auth/sso/callback`;
    const result = await processSamlResponse(samlResponseB64, config, spEntityId, acsUrl);
    if (!result.success || !result.identity) {
      throw redirect(
        302,
        `/console/login?error=sso_failed&message=${encodeURIComponent(result.error || "SAML validation failed")}`
      );
    }
    identity = result.identity;
  } else if (config.protocol === "oidc" && code) {
    const redirectUri = `${url.origin}/api/auth/sso/callback`;
    const codeVerifier = stateRow.code_verifier;
    if (!codeVerifier) {
      throw redirect(302, "/console/login?error=sso_pkce_missing");
    }
    const result = await processOidcCallback(code, config, redirectUri, codeVerifier);
    if (!result.success || !result.identity) {
      throw redirect(
        302,
        `/console/login?error=sso_failed&message=${encodeURIComponent(result.error || "OIDC validation failed")}`
      );
    }
    identity = result.identity;
  } else {
    throw redirect(302, "/console/login?error=sso_protocol_mismatch");
  }
  const email = identity.email;
  const displayName = identity.displayName || identity.email;
  let userId = null;
  let roles = [];
  let isSuperAdmin = false;
  try {
    const userRow = await db.prepare("SELECT id, roles FROM console_users WHERE email = ? COLLATE NOCASE AND tenant_id = ? LIMIT 1").bind(email, tenantId).first();
    if (userRow) {
      userId = userRow.id;
      try {
        roles = JSON.parse(userRow.roles);
      } catch {
        roles = ["member"];
      }
    }
  } catch {
  }
  if (!userId && config.jitProvisioning) {
    userId = crypto.randomUUID();
    roles = config.defaultRoles;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await db.prepare(
        `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
           VALUES (?, ?, 'sso-no-password', 'sso', ?, ?, ?, ?)`
      ).bind(userId, email, displayName, JSON.stringify(roles), tenantId, now).run();
      await db.prepare(
        `INSERT OR IGNORE INTO console_user_roles (email, roles, tenant_id) VALUES (?, ?, ?)`
      ).bind(email, JSON.stringify(roles), tenantId).run();
    } catch (e) {
      console.error("JIT provisioning failed:", e);
    }
  }
  if (!userId) {
    throw redirect(
      302,
      `/console/login?error=sso_no_account&message=${encodeURIComponent("No account found. Contact your admin.")}`
    );
  }
  const superAdminEmail = (platform?.env?.SUPER_ADMIN_EMAIL || "").toLowerCase();
  isSuperAdmin = email.toLowerCase() === superAdminEmail || roles.includes("super-admin");
  const secPolicy = await loadTenantSecurityPolicy(db, tenantId);
  const mfaRequired = isMfaRequiredForUser(secPolicy, roles);
  const bypassMfa = config.ssoBypassMfa;
  const effectiveMfaVerified = bypassMfa || !mfaRequired;
  const sessionTtl = getSessionTtl(secPolicy, effectiveMfaVerified);
  const sid = crypto.randomUUID();
  const sessionData = {
    userId,
    email,
    displayName,
    roles: isSuperAdmin && !roles.includes("super-admin") ? [...roles, "super-admin"] : roles,
    superAdmin: isSuperAdmin,
    provider: `sso-${config.protocol}`,
    tenantId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
    mfaVerified: effectiveMfaVerified,
    ssoProvider: config.idpName || config.protocol
  };
  await kv.put(sid, JSON.stringify(sessionData), { expirationTtl: sessionTtl });
  cookies.set("atlas_session", sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: sessionTtl
  });
  cookies.delete("atlas_session_cache", { path: "/" });
  if (mfaRequired && !bypassMfa) {
    try {
      const mfaRow = await db.prepare("SELECT verified FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1").bind(userId).first();
      if (!mfaRow) {
        throw redirect(302, "/console/settings/security?setup_mfa=1");
      }
    } catch (e) {
      if (e instanceof Response || e?.status) throw e;
    }
  }
  const redirectUrl = stateRow.redirect_url || "/console";
  throw redirect(302, redirectUrl);
}
async function loadTenantSecurityPolicy(db, tenantId) {
  try {
    const row = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(tenantId, "security_policy").first();
    return resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
  } catch {
    return resolveSecurityPolicy(null);
  }
}

export { GET, POST };
//# sourceMappingURL=_server.ts-ov75D3lb.js.map
