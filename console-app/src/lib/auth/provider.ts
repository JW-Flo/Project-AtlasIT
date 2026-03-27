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
    SUPER_ADMIN_EMAIL?: string;
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
 * No external auth providers — authentication is handled by
 * email/password login via /api/auth/login which creates a
 * session in KV_SESSIONS.
 */
export const activeProviders: AuthProvider[] = [];
