import type { Handle, HandleServerError } from "@sveltejs/kit";
import { redirect, isRedirect, isHttpError } from "@sveltejs/kit";
import type { UserPrincipal } from "./lib/auth/provider";
import { matchRoutePermission } from "$lib/server/permissions";
import { validateEncryptionConfig } from "$lib/server/credentials";

/**
 * Routes that are intentionally public (no authentication required).
 * Everything else under /api/* is deny-by-default.
 */
const PUBLIC_API_PREFIXES = [
  "/api/auth/", // login, register, SSO, MFA verify
  "/api/health", // health checks
  "/api/trust/", // public trust center
  "/api/billing/webhook", // Stripe webhooks (verified by signature)
  "/api/platform/health", // platform status (public)
  "/api/support", // public support form submissions
  "/api/privacy/dsar", // public data subject access requests
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

let encryptionValidated = false;

/** How often (ms) to refresh session in KV. Reduces writes from every-request to ~1 per 5 min. */
const SESSION_REFRESH_INTERVAL_MS = 300_000;

/**
 * KV cacheTtl (seconds) — Cloudflare KV caches reads at the edge for this
 * duration, eliminating repeated KV fetches without trusting an unsigned cookie.
 * Minimum is 60s; we use 60s for a tight revalidation window.
 */
const KV_CACHE_TTL = 60;

/**
 * Returns true only when running in a real local dev environment.
 * This check intentionally cannot be satisfied in production because:
 *   - Cloudflare Workers do not expose NODE_ENV at runtime.
 *   - The wrangler.toml production config must never set DEV_AUTH_BYPASS=true.
 *
 * Dev bypass logs a clear warning so it is never silently active.
 */
function isDevAuthBypass(env: Record<string, string | undefined>): boolean {
  const devBypass =
    (env["DEV_AUTH_BYPASS"] ?? "").toLowerCase() === "true" &&
    (env["NODE_ENV"] ?? "").toLowerCase() === "development";
  if (devBypass) {
    console.log(
      JSON.stringify({
        level: "warn",
        event: "auth.dev_bypass_active",
        message: "DEV_AUTH_BYPASS is active — this MUST NOT appear in production logs",
      }),
    );
  }
  return devBypass;
}

export const handle: Handle = async ({ event, resolve }) => {
  if (!encryptionValidated && event.platform?.env) {
    validateEncryptionConfig(event.platform.env as Record<string, unknown>);
    encryptionValidated = true;
  }

  const sessionId = event.cookies.get("atlas_session");
  let user: UserPrincipal | null = null;

  // Typed env: avoid spreading `any` through the rest of the handler.
  // We use `Record<string, string | undefined>` because wrangler vars are strings.
  const envRaw = event.platform?.env as unknown as Record<string, string | undefined>;
  const envAny = event.platform?.env as Record<string, unknown> | undefined;

  const devBypass = isDevAuthBypass(envRaw ?? {});

  // ------------------------------------------------------------------
  // 1. Authentication is session-based (email/password via /api/auth/login)
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // 2. Session lookup — use cache cookie to avoid KV reads
  // ------------------------------------------------------------------
  if (!user && !devBypass && sessionId) {
    // Always validate session against KV (source of truth).
    // cacheTtl reduces KV read cost at the edge without trusting unsigned cookies.
    try {
      const kv = envAny?.["KV_SESSIONS"] as KVNamespace | undefined;
      if (kv) {
        const sessionData = await kv.get(sessionId, { cacheTtl: KV_CACHE_TTL });
        if (sessionData) {
          user = JSON.parse(sessionData) as UserPrincipal;
        }
      }
    } catch (e) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "auth.session_lookup_failed",
          err: String(e),
        }),
      );
    }

    // Clear any stale session cache cookies from before this hardening
    if (event.cookies.get("atlas_session_cache")) {
      event.cookies.delete("atlas_session_cache", { path: "/" });
    }

    // Ensure superAdmin flag is always derived authoritatively on every request.
    // SUPER_ADMIN_EMAIL grants super-admin regardless of stored session value,
    // so a role change or email match takes effect without requiring re-login.
    if (user) {
      const superAdminEmail = (envRaw?.["SUPER_ADMIN_EMAIL"] || "").toLowerCase();
      const isSuperByEmail = Boolean(
        superAdminEmail && user.email?.toLowerCase() === superAdminEmail,
      );
      const isSuperByRole = (user.roles ?? []).includes("super-admin");
      user.superAdmin = isSuperByEmail || isSuperByRole;
      // Ensure roles array includes "super-admin" so UI nav guards work
      if (user.superAdmin && !(user.roles ?? []).includes("super-admin")) {
        user.roles = [...(user.roles ?? []), "super-admin"];
      }
    }

    // Sessions missing tenantId are invalid — invalidate and force re-login.
    // Inferring tenant from DB (especially falling back to "first tenant") is a
    // tenant-isolation risk and is not permitted.
    if (user && !user.tenantId) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "auth.session_missing_tenant_id",
          message: "Session has no tenantId — invalidating",
          email: user.email,
        }),
      );
      user = null;
      event.cookies.delete("atlas_session", { path: "/" });
      const isApiRoute = event.url.pathname.startsWith("/api/");
      if (isApiRoute) {
        return new Response(
          JSON.stringify({ error: "Session invalid", code: "session_invalid" }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }
      throw redirect(302, "/console/login?error=session_invalid");
    }

    // Throttle lastSeenAt refresh — only write to KV every 5 minutes
    if (user) {
      const lastSeen = new Date(user.lastSeenAt).getTime();
      const now = Date.now();
      if (now - lastSeen > SESSION_REFRESH_INTERVAL_MS) {
        user.lastSeenAt = new Date().toISOString();
        try {
          const kv = envAny?.["KV_SESSIONS"] as KVNamespace | undefined;
          if (kv) {
            await kv.put(sessionId, JSON.stringify(user), {
              expirationTtl: 604800,
            });
          }
        } catch {
          // Non-blocking — session is still valid
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // 3. Dev bypass: inject synthetic super-admin user
  // ------------------------------------------------------------------
  if (devBypass && !user) {
    const now = new Date().toISOString();
    user = {
      userId: "dev@localhost",
      email: "dev@localhost",
      roles: ["super-admin"],
      superAdmin: true,
      provider: "dev-bypass",
      tenantId: envRaw?.["DEV_TENANT_ID"] || "dev-tenant",
      createdAt: now,
      lastSeenAt: now,
    };
  }

  event.locals.user = user;

  // ------------------------------------------------------------------
  // 3b. Disabled tenant check — block all non-super-admin access
  // ------------------------------------------------------------------
  if (user && user.tenantId && !user.superAdmin) {
    try {
      const db = envAny?.["ATLAS_SHARED_DB"] as D1Database | undefined;
      if (db) {
        const tenantRow = await db
          .prepare("SELECT status FROM tenants WHERE id = ? LIMIT 1")
          .bind(user.tenantId)
          .first<{ status: string }>();
        if (tenantRow?.status === "disabled") {
          const isApiRoute = event.url.pathname.startsWith("/api/");
          if (isApiRoute) {
            return new Response(
              JSON.stringify({ error: "Tenant account is disabled", code: "tenant_disabled" }),
              { status: 403, headers: { "content-type": "application/json" } },
            );
          }
          // Clear session cookies so the user is not stuck in a redirect loop
          event.cookies.delete("atlas_session", { path: "/" });
          event.cookies.delete("atlas_session_cache", { path: "/" });
          throw redirect(302, "/console/login?error=tenant_disabled");
        }
      }
    } catch (e) {
      // Re-throw SvelteKit redirects and HTTP errors; only swallow DB errors
      if (isRedirect(e) || isHttpError(e)) throw e;
      console.error(
        JSON.stringify({
          level: "error",
          event: "auth.tenant_status_check_failed",
          err: String(e),
        }),
      );
    }
  }

  // ------------------------------------------------------------------
  // 4. Centralized RBAC enforcement for API routes (deny-by-default)
  // ------------------------------------------------------------------
  if (event.url.pathname.startsWith("/api/")) {
    // Public routes that don't require authentication
    const isPublicRoute = isPublicApiRoute(event.url.pathname);

    if (!isPublicRoute) {
      // Deny-by-default: all /api/* routes require authentication unless explicitly public
      if (!user) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      // Check RBAC permissions for routes in the permission matrix
      const requiredRoles = matchRoutePermission(event.url.pathname, event.request.method);
      if (requiredRoles !== undefined && requiredRoles !== null) {
        // Super-admins bypass role checks
        if (!user.superAdmin) {
          const userRoles: string[] = user.roles ?? [];
          const hasRole = requiredRoles.some((r) => userRoles.includes(r));
          if (!hasRole) {
            return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
              status: 403,
              headers: { "content-type": "application/json" },
            });
          }
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // 5. Route protection: /console/* requires authentication
  // ------------------------------------------------------------------
  if (
    event.url.pathname.startsWith("/console") &&
    !event.url.pathname.startsWith("/console/login") &&
    !event.url.pathname.startsWith("/console/onboarding")
  ) {
    if (!user) {
      // API routes return 401; page routes redirect to login
      if (event.url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "unauthorized", code: "auth_required" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      throw redirect(302, "/console/login");
    }
  }

  return resolve(event);
};

/**
 * Normalizes unhandled server errors so the UI never receives raw stack
 * traces, HTML error pages, or internal exception messages.
 *
 * SvelteKit calls this when a +server.ts or +page.server.ts throws an
 * unhandled error. The returned object becomes the `$page.error` value.
 * For API routes, SvelteKit serializes it as JSON automatically.
 */
export const handleError: HandleServerError = ({ error, event }) => {
  const message = error instanceof Error ? error.message : "Internal server error";

  console.error(
    JSON.stringify({
      level: "error",
      event: "request.unhandled_error",
      message,
      path: event.url.pathname,
      method: event.request.method,
      ts: new Date().toISOString(),
    }),
  );

  // Expose error details only to super-admins via ?_debug=1.
  // In production, even super-admins receive only the message — not the stack
  // trace — to prevent accidental exposure through shared URLs or screenshots.
  const debug = event.url.searchParams.get("_debug") === "1";
  const user = event.locals.user as UserPrincipal | null | undefined;
  const isSuperAdmin = Boolean(user?.superAdmin || (user?.roles ?? []).includes("super-admin"));
  const isProduction = (event.platform?.env as Record<string, string | undefined> | undefined)?.[
    "NODE_ENV"
  ] !== "development";

  if (debug && isSuperAdmin) {
    if (isProduction) {
      // Production: message only — no stack trace
      return { message, code: "INTERNAL_ERROR" };
    }
    // Non-production: include partial stack for local debugging
    const stack = error instanceof Error ? error.stack : String(error);
    return {
      message: `${message} | ${(stack || "").split("\n").slice(0, 3).join(" ")}`,
      code: "INTERNAL_ERROR",
    };
  }

  // Never expose internal details to the client.
  return { message: "An unexpected error occurred", code: "INTERNAL_ERROR" };
};
