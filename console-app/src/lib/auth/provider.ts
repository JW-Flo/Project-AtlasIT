import {
  validateCfAccessJwt,
  buildCertsUrl,
  type CfAccessJwtPayload,
} from "./cf-access-jwt";

export interface UserPrincipal {
  userId: string;
  email: string;
  roles: string[];
  superAdmin?: boolean;
  provider: string;
  tenantId?: string;
  displayName?: string;
  createdAt: string;
  lastSeenAt: string;
  impersonating?: boolean;
  impersonatedBy?: string;
  originalSessionId?: string;
}

export interface AuthProviderContext {
  headers: Headers;
  env: {
    ALLOWED_ACCESS_EMAILS?: string;
    SUPER_ADMIN_EMAIL?: string;
    CF_ACCESS_AUD?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
  };
  kv: KVNamespace | undefined;
  db?: D1Database;
}

export interface AuthProvider {
  name: string;
  resolve(ctx: AuthProviderContext): Promise<UserPrincipal | null>;
}

/**
 * Fetches roles from the console_user_roles D1 table.
 * Falls back to ["viewer"] when the user has no row or D1 is unavailable.
 */
export async function fetchUserRoles(
  db: D1Database | undefined,
  email: string,
): Promise<{ roles: string[]; tenantId?: string }> {
  const DEFAULT_ROLES = ["viewer"];
  if (!db) {
    return { roles: DEFAULT_ROLES };
  }
  try {
    const row = await db
      .prepare(
        "SELECT roles, tenant_id FROM console_user_roles WHERE email = ? LIMIT 1",
      )
      .bind(email)
      .first<{ roles: string; tenant_id: string }>();

    if (!row) {
      return { roles: DEFAULT_ROLES };
    }

    const parsed = JSON.parse(row.roles) as string[];
    return {
      roles:
        Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ROLES,
      tenantId: row.tenant_id || undefined,
    };
  } catch (e) {
    console.log(
      JSON.stringify({
        level: "warn",
        event: "auth.roles_lookup_failed",
        email,
        err: String(e),
      }),
    );
    return { roles: DEFAULT_ROLES };
  }
}

/**
 * Cloudflare Access JWT provider.
 *
 * Validates the `Cf-Access-Jwt-Assertion` JWT header:
 *   - Fetches signing keys from the Access certs endpoint.
 *   - Verifies RS256 signature, audience, and expiry.
 *   - Checks email against the allow-list (ALLOWED_ACCESS_EMAILS / SUPER_ADMIN_EMAIL).
 *   - Fetches roles from D1 console_user_roles table (falls back to ["viewer"]).
 *
 * Structured auth decisions are logged for auditability.
 */
export class CloudflareAccessProvider implements AuthProvider {
  name = "cloudflare-access";

  async resolve(ctx: AuthProviderContext): Promise<UserPrincipal | null> {
    const { env, headers } = ctx;

    const teamDomain = env.CF_ACCESS_TEAM_DOMAIN ?? "";
    const audience = env.CF_ACCESS_AUD ?? "";
    const certsUrl = teamDomain ? buildCertsUrl(teamDomain) : "";

    // Require both team domain and audience to be configured.
    if (!teamDomain || !audience || !certsUrl) {
      console.log(
        JSON.stringify({
          level: "warn",
          event: "auth.cf_access.config_missing",
          message: "CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD not configured",
        }),
      );
      return null;
    }

    const result = await validateCfAccessJwt(headers, { audience, certsUrl });

    if (!result.valid) {
      console.log(
        JSON.stringify({
          level: "warn",
          event: "auth.cf_access.jwt_invalid",
          reason: result.reason,
        }),
      );
      return null;
    }

    const claims: CfAccessJwtPayload = result.claims;
    const email = (claims.email ?? claims.sub ?? "").toLowerCase();

    // Enforce email allow-list.
    const allowed = (env.ALLOWED_ACCESS_EMAILS ?? env.SUPER_ADMIN_EMAIL ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (allowed.length > 0 && !allowed.includes(email)) {
      console.log(
        JSON.stringify({
          level: "warn",
          event: "auth.cf_access.email_not_allowed",
          email,
        }),
      );
      return null;
    }

    // Fetch roles from D1 instead of hardcoding super-admin.
    const { roles, tenantId } = await fetchUserRoles(ctx.db, email);
    const isSuperAdmin = roles.includes("super-admin");

    const now = new Date().toISOString();
    const principal: UserPrincipal = {
      userId: email,
      email,
      roles,
      superAdmin: isSuperAdmin,
      provider: this.name,
      tenantId,
      createdAt: now,
      lastSeenAt: now,
    };

    console.log(
      JSON.stringify({
        level: "info",
        event: "auth.cf_access.authenticated",
        email,
        roles,
        sub: claims.sub,
        aud: Array.isArray(claims.aud) ? claims.aud : [claims.aud],
        exp: claims.exp,
      }),
    );

    return principal;
  }
}

export const activeProviders: AuthProvider[] = [new CloudflareAccessProvider()];
