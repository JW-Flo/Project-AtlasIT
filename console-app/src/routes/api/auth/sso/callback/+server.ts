import type { RequestHandler } from "@sveltejs/kit";
import { json, redirect } from "@sveltejs/kit";
import type { SSOConfigRow } from "@atlasit/shared/sso/types";
import { rowToConfig } from "@atlasit/shared/sso/types";
import { processSamlResponse } from "@atlasit/shared/sso/saml";
import { processOidcCallback } from "@atlasit/shared/sso/oidc";
import {
  resolveSecurityPolicy,
  isMfaRequiredForUser,
  getSessionTtl,
} from "@atlasit/shared/security/policies";
import type { SSOIdentity } from "@atlasit/shared/sso/types";

/**
 * POST /api/auth/sso/callback — SAML HTTP-POST binding
 * GET  /api/auth/sso/callback — OIDC authorization code redirect
 */
export const POST: RequestHandler = async ({ request, url, platform, cookies }) => {
  return handleCallback("saml", request, url, platform, cookies);
};

export const GET: RequestHandler = async ({ request, url, platform, cookies }) => {
  return handleCallback("oidc", request, url, platform, cookies);
};

async function handleCallback(
  expectedProtocol: "saml" | "oidc",
  request: Request,
  url: URL,
  platform: any,
  cookies: any,
): Promise<Response> {
  const db = platform?.env?.ATLAS_SHARED_DB;
  const kv = platform?.env?.KV_SESSIONS;

  if (!db || !kv) {
    return json({ error: "Service unavailable" }, { status: 503 });
  }

  let state: string | null = null;
  let samlResponseB64: string | null = null;
  let code: string | null = null;

  if (expectedProtocol === "saml") {
    const formData = await request.formData().catch(() => null);
    samlResponseB64 = formData?.get("SAMLResponse") as string | null;
    state = formData?.get("RelayState") as string | null;
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

  // Look up stored state
  let stateRow: { tenant_id: string; protocol: string; code_verifier: string | null; redirect_url: string | null } | null;
  try {
    stateRow = await db
      .prepare(
        "SELECT tenant_id, protocol, code_verifier, redirect_url FROM sso_auth_state WHERE state = ? AND expires_at > datetime('now')",
      )
      .bind(state)
      .first();

    // Delete used state (one-time use)
    await db
      .prepare("DELETE FROM sso_auth_state WHERE state = ?")
      .bind(state)
      .run();
  } catch {
    throw redirect(302, "/console/login?error=sso_state_error");
  }

  if (!stateRow) {
    throw redirect(302, "/console/login?error=sso_expired");
  }

  const tenantId = stateRow.tenant_id;

  // Load SSO config
  let config;
  try {
    const row = await db
      .prepare("SELECT * FROM sso_configurations WHERE tenant_id = ? AND enabled = 1 LIMIT 1")
      .bind(tenantId)
      .first<SSOConfigRow>();
    if (!row) throw new Error("No SSO config");
    config = rowToConfig(row);
  } catch {
    throw redirect(302, "/console/login?error=sso_config_missing");
  }

  // Process the callback based on protocol
  let identity: SSOIdentity | null = null;

  if (config.protocol === "saml" && samlResponseB64) {
    const origin = url.origin;
    const spEntityId = `${origin}/api/auth/sso/metadata`;
    const acsUrl = `${origin}/api/auth/sso/callback`;

    const result = await processSamlResponse(samlResponseB64, config, spEntityId, acsUrl);
    if (!result.success || !result.identity) {
      throw redirect(
        302,
        `/console/login?error=sso_failed&message=${encodeURIComponent(result.error || "SAML validation failed")}`,
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
        `/console/login?error=sso_failed&message=${encodeURIComponent(result.error || "OIDC validation failed")}`,
      );
    }
    identity = result.identity;
  } else {
    throw redirect(302, "/console/login?error=sso_protocol_mismatch");
  }

  // ── JIT Provisioning & Session Creation ──────────────────────────────────

  const email = identity.email;
  const displayName = identity.displayName || identity.email;

  // Look up existing user
  let userId: string | null = null;
  let roles: string[] = [];
  let isSuperAdmin = false;

  try {
    const userRow = await db
      .prepare("SELECT id, roles FROM console_users WHERE email = ? COLLATE NOCASE AND tenant_id = ? LIMIT 1")
      .bind(email, tenantId)
      .first<{ id: string; roles: string }>();

    if (userRow) {
      userId = userRow.id;
      try { roles = JSON.parse(userRow.roles); } catch { roles = ["member"]; }
    }
  } catch {
    // Table might not have tenant_id column, try without
    try {
      const userRow2 = await db
        .prepare("SELECT id, roles FROM console_users WHERE email = ? COLLATE NOCASE LIMIT 1")
        .bind(email)
        .first<{ id: string; roles: string }>();
      if (userRow2) {
        userId = userRow2.id;
        try { roles = JSON.parse(userRow2.roles); } catch { roles = ["member"]; }
      }
    } catch { /* ignore */ }
  }

  // JIT: create user if not exists and JIT is enabled
  if (!userId && config.jitProvisioning) {
    userId = crypto.randomUUID();
    roles = config.defaultRoles;
    const now = new Date().toISOString();

    try {
      await db
        .prepare(
          `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
           VALUES (?, ?, 'sso-no-password', 'sso', ?, ?, ?, ?)`,
        )
        .bind(userId, email, displayName, JSON.stringify(roles), tenantId, now)
        .run();

      // Also add to console_user_roles for RBAC
      await db
        .prepare(
          `INSERT OR IGNORE INTO console_user_roles (email, roles, tenant_id) VALUES (?, ?, ?)`,
        )
        .bind(email, JSON.stringify(roles), tenantId)
        .run();
    } catch (e) {
      console.error("JIT provisioning failed:", e);
      // Non-fatal: user can still log in if they exist in some form
    }
  }

  if (!userId) {
    throw redirect(
      302,
      `/console/login?error=sso_no_account&message=${encodeURIComponent("No account found. Contact your admin.")}`,
    );
  }

  // Check super admin
  const superAdminEmail = ((platform?.env as any)?.SUPER_ADMIN_EMAIL || "").toLowerCase();
  isSuperAdmin = email.toLowerCase() === superAdminEmail || roles.includes("super-admin");

  // Load tenant security policy to determine session TTL
  const secPolicy = await loadTenantSecurityPolicy(db, tenantId);
  const mfaRequired = isMfaRequiredForUser(secPolicy, roles);
  const bypassMfa = config.ssoBypassMfa;

  // SSO sessions are treated as verified auth; MFA can be bypassed if configured
  const effectiveMfaVerified = bypassMfa || !mfaRequired;
  const sessionTtl = getSessionTtl(secPolicy, effectiveMfaVerified);

  // Create session
  const sid = crypto.randomUUID();
  const sessionData = {
    userId,
    email,
    displayName,
    roles: isSuperAdmin && !roles.includes("super-admin") ? [...roles, "super-admin"] : roles,
    superAdmin: isSuperAdmin,
    provider: `sso-${config.protocol}`,
    tenantId,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    mfaVerified: effectiveMfaVerified,
    ssoProvider: config.idpName || config.protocol,
  };

  await kv.put(sid, JSON.stringify(sessionData), { expirationTtl: sessionTtl });

  cookies.set("atlas_session", sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: sessionTtl,
  });

  // Clear any stale cache cookie
  cookies.delete("atlas_session_cache", { path: "/" });

  // If MFA is required and not bypassed, redirect to MFA setup/verify
  if (mfaRequired && !bypassMfa) {
    // Check if user has MFA enrolled
    try {
      const mfaRow = await db
        .prepare("SELECT verified FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1")
        .bind(userId)
        .first();

      if (!mfaRow) {
        // Need MFA enrollment
        throw redirect(302, "/console/settings/security?setup_mfa=1");
      }
      // Has MFA but needs to verify — redirect to MFA challenge
      // For now, allow through since they authenticated via IdP
    } catch (e) {
      if (e instanceof Response || (e as any)?.status) throw e;
      // MFA table might not exist; allow through
    }
  }

  const redirectUrl = stateRow.redirect_url || "/console";
  throw redirect(302, redirectUrl);
}

async function loadTenantSecurityPolicy(db: any, tenantId: string) {
  try {
    const row = await db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?")
      .bind(tenantId, "security_policy")
      .first<{ value: string }>();
    return resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
  } catch {
    return resolveSecurityPolicy(null);
  }
}
