import type { Handle, HandleServerError } from "@sveltejs/kit";
import { redirect, isRedirect, isHttpError } from "@sveltejs/kit";
import type { UserPrincipal } from "./lib/auth/provider";
import { matchRoutePermission } from "$lib/server/permissions";
import { validateEncryptionConfig } from "$lib/server/credentials";
import { checkBodySizeLimit, parseBodySizeLimit, BODY_METHODS } from "$lib/server/body-size-limit";
import {
  getSession as pgGetSession,
  putSession as pgPutSession,
  getTenantStatus,
} from "$lib/server/session-store";

/**
 * Default maximum request body size (512 KB).
 * Override at runtime via the BODY_SIZE_LIMIT environment variable.
 * Setting the variable to "0" disables the limit entirely.
 *
 * Mitigates the BODY_SIZE_LIMIT bypass described in the
 * @sveltejs/adapter-node security advisory: the enforcement validates actual
 * bytes transferred in addition to the (spoofable) Content-Length header.
 */
const BODY_SIZE_LIMIT_DEFAULT = 512 * 1024; // 512 KB

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
  "/api/demo/", // public interactive demo analytics
  "/api/cron/", // scheduled jobs (authenticated by Bearer token, not session)
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

let encryptionValidated = false;

/** How often (ms) to refresh session in KV. Reduces writes from every-request to ~1 per 5 min. */
const SESSION_REFRESH_INTERVAL_MS = 300_000;

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

  const envForAuth = { ...process.env, ...(envRaw ?? {}) };
  const devBypass = isDevAuthBypass(envForAuth);

  // True in CF Workers (platform.env is the Cloudflare bindings object).
  // False in Lambda/Node.js (platform is undefined, auth lives in browser sessionStorage).
  const isCfWorkersMode = !!event.platform?.env;

  // ------------------------------------------------------------------
  // 0. Body size enforcement (BODY_SIZE_LIMIT bypass mitigation)
  //    Rejects oversized bodies before any auth or DB work is done.
  //    Delegates to checkBodySizeLimit() which checks Content-Length first
  //    (fast path) then streams actual bytes — preventing spoofing attacks.
  // ------------------------------------------------------------------
  if (BODY_METHODS.has(event.request.method) && event.request.body) {
    const bodySizeLimit = parseBodySizeLimit(envRaw?.["BODY_SIZE_LIMIT"], BODY_SIZE_LIMIT_DEFAULT);
    const result = await checkBodySizeLimit(event.request, bodySizeLimit);
    if (result.blocked) {
      return result.response;
    }
    // Reconstruct event.request with the pre-read body buffer so downstream
    // route handlers can still call request.json() / request.text() etc.
    // Object.assign is used to sidestep the TypeScript readonly constraint
    // on RequestEvent.request while remaining safe at runtime.
    Object.assign(event, { request: result.request });
  }

  // ------------------------------------------------------------------
  // 1. Authentication is session-based (email/password via /api/auth/login)
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // 2. Session lookup — PG-backed sessions (replaces Cloudflare KV)
  // ------------------------------------------------------------------
  if (!user && !devBypass && sessionId) {
    try {
      const sessionData = await pgGetSession(sessionId);
      if (sessionData) {
        user = sessionData as unknown as UserPrincipal;
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

    if (event.cookies.get("atlas_session_cache")) {
      event.cookies.delete("atlas_session_cache", { path: "/" });
    }

    if (user) {
      const superAdminEmail = (
        process.env.SUPER_ADMIN_EMAIL ||
        envRaw?.["SUPER_ADMIN_EMAIL"] ||
        ""
      ).toLowerCase();
      const isSuperByEmail = Boolean(
        superAdminEmail && user.email?.toLowerCase() === superAdminEmail,
      );
      const isSuperByRole = (user.roles ?? []).includes("super-admin");
      user.superAdmin = isSuperByEmail || isSuperByRole;
      if (user.superAdmin && !(user.roles ?? []).includes("super-admin")) {
        user.roles = [...(user.roles ?? []), "super-admin"];
      }
    }

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
        return new Response(JSON.stringify({ error: "Session invalid", code: "session_invalid" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      throw redirect(302, "/console/login?error=session_invalid");
    }

    if (user) {
      const lastSeen = new Date(user.lastSeenAt).getTime();
      const now = Date.now();
      if (now - lastSeen > SESSION_REFRESH_INTERVAL_MS) {
        user.lastSeenAt = new Date().toISOString();
        try {
          await pgPutSession(sessionId, user as unknown as Record<string, unknown>, 604800);
        } catch {
          // Non-blocking
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
      const tenantStatus = await getTenantStatus(user.tenantId);
      if (tenantStatus === "disabled") {
        const isApiRoute = event.url.pathname.startsWith("/api/");
        if (isApiRoute) {
          return new Response(
            JSON.stringify({ error: "Tenant account is disabled", code: "tenant_disabled" }),
            { status: 403, headers: { "content-type": "application/json" } },
          );
        }
        event.cookies.delete("atlas_session", { path: "/" });
        event.cookies.delete("atlas_session_cache", { path: "/" });
        throw redirect(302, "/console/login?error=tenant_disabled");
      }
    } catch (e) {
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
  //
  // In Lambda/SPA mode (isCfWorkersMode=false), auth lives in browser
  // sessionStorage and the client-side guard in +layout.svelte handles
  // unauthenticated page access. Server-side page redirects only fire
  // in CF Workers mode where session cookies are validated server-side.
  // API routes are always protected regardless of deployment mode.
  // ------------------------------------------------------------------
  if (
    event.url.pathname.startsWith("/console") &&
    !event.url.pathname.startsWith("/console/login") &&
    !event.url.pathname.startsWith("/console/onboarding")
  ) {
    if (!user) {
      if (event.url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "unauthorized", code: "auth_required" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      // Only server-redirect in CF Workers; Lambda lets the client guard run.
      if (isCfWorkersMode) {
        throw redirect(302, "/console/login");
      }
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
  const isProduction =
    (event.platform?.env as Record<string, string | undefined> | undefined)?.["NODE_ENV"] !==
    "development";

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
