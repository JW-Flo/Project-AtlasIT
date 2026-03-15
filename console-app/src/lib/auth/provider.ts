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
}

export interface AuthProvider {
  name: string;
  resolve(ctx: AuthProviderContext): Promise<UserPrincipal | null>;
}

/**
 * Cloudflare Access JWT provider.
 *
 * Validates the `Cf-Access-Jwt-Assertion` JWT header:
 *   - Fetches signing keys from the Access certs endpoint.
 *   - Verifies RS256 signature, audience, and expiry.
 *   - Checks email against the allow-list (ALLOWED_ACCESS_EMAILS / SUPER_ADMIN_EMAIL).
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

    const now = new Date().toISOString();
    const principal: UserPrincipal = {
      userId: email,
      email,
      roles: ["super-admin"],
      superAdmin: true,
      provider: this.name,
      createdAt: now,
      lastSeenAt: now,
    };

    console.log(
      JSON.stringify({
        level: "info",
        event: "auth.cf_access.authenticated",
        email,
        sub: claims.sub,
        aud: Array.isArray(claims.aud) ? claims.aud : [claims.aud],
        exp: claims.exp,
      }),
    );

    return principal;
  }
}

export const activeProviders: AuthProvider[] = [new CloudflareAccessProvider()];
