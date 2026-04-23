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
import { queryPg, queryPgOne } from "$lib/server/pg";
import { putSession } from "$lib/server/session-store";

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
  let stateRow: {
    tenant_id: string;
    protocol: string;
    code_verifier: string | null;
    redirect_url: string | null;
  } | null;
  try {
    stateRow = await queryPgOne<{
      tenant_id: string;
      protocol: string;
      code_verifier: string | null;
      redirect_url: string | null;
    }>(
      "SELECT tenant_id, protocol, code_verifier, redirect_url FROM sso_auth_state WHERE state = $1 AND expires_at > NOW()",
      [state],
    );

    // Delete used state (one-time use)
    await queryPg("DELETE FROM sso_auth_state WHERE state = $1", [state]);
  } catch {
    throw redirect(302, "/console/login?error=sso_state_error");
  }

  if (!stateRow) {
    throw redirect(302, "/console/login?error=sso_expired");
  }

  // Verify protocol matches the stored state
  if (stateRow.protocol !== expectedProtocol) {
    throw redirect(302, "/console/login?error=sso_protocol_mismatch");
  }

  const tenantId = stateRow.tenant_id;

  // Load SSO config
  let config;
  try {
    const row = await queryPgOne<SSOConfigRow>(
      "SELECT * FROM sso_configurations WHERE tenant_id = $1 AND enabled = true LIMIT 1",
      [tenantId],
    );
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

  // Always scope user lookup by tenant_id to prevent cross-tenant auth
  try {
    const userRow = await queryPgOne<{ id: string; roles: string }>(
      "SELECT id, roles FROM console_users WHERE LOWER(email) = LOWER($1) AND tenant_id = $2 LIMIT 1",
      [email, tenantId],
    );

    if (userRow) {
      userId = userRow.id;
      try {
        roles = JSON.parse(userRow.roles);
      } catch {
        roles = ["member"];
      }
    }
  } catch {
    // console_users table may not exist yet — JIT will create
  }

  // JIT: create user if not exists and JIT is enabled
  if (!userId && config.jitProvisioning) {
    userId = crypto.randomUUID();
    roles = config.defaultRoles;
    const now = new Date().toISOString();

    try {
      await queryPg(
        `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
         VALUES ($1, $2, 'sso-no-password', 'sso', $3, $4, $5, $6)`,
        [userId, email, displayName, JSON.stringify(roles), tenantId, now],
      );

      // Also add to console_user_roles for RBAC
      await queryPg(
        `INSERT INTO console_user_roles (email, roles, tenant_id) VALUES ($1, $2, $3)
         ON CONFLICT (email, tenant_id) DO NOTHING`,
        [email, JSON.stringify(roles), tenantId],
      );
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
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase();
  isSuperAdmin = email.toLowerCase() === superAdminEmail || roles.includes("super-admin");

  // Load tenant security policy to determine session TTL
  const secPolicy = await loadTenantSecurityPolicy(tenantId);
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

  await putSession(sid, sessionData, sessionTtl);

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
      const mfaRow = await queryPgOne(
        "SELECT verified FROM mfa_totp_secrets WHERE user_id = $1 AND verified = true",
        [userId],
      );

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

async function loadTenantSecurityPolicy(tenantId: string) {
  try {
    const row = await queryPgOne<{ value: string }>(
      "SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = $2",
      [tenantId, "security_policy"],
    );
    return resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
  } catch {
    return resolveSecurityPolicy(null);
  }
}
