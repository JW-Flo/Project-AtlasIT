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
  env: any;
  kv: KVNamespace | undefined;
}

export interface AuthProvider {
  name: string;
  resolve(ctx: AuthProviderContext): Promise<UserPrincipal | null>;
}

export class CloudflareAccessProvider implements AuthProvider {
  name = "cloudflare-access";
  async resolve(ctx: AuthProviderContext): Promise<UserPrincipal | null> {
    const allowed = (ctx.env.ALLOWED_ACCESS_EMAILS || ctx.env.SUPER_ADMIN_EMAIL || "")
      .split(",")
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);
    const email = ctx.headers.get("cf-access-authenticated-user-email")?.toLowerCase();
    if (!email || !allowed.includes(email)) return null;
    const now = new Date().toISOString();
    return {
      userId: email,
      email,
      roles: ["super-admin"],
      superAdmin: true,
      provider: this.name,
      createdAt: now,
      lastSeenAt: now,
    };
  }
}

export const activeProviders: AuthProvider[] = [new CloudflareAccessProvider()];
