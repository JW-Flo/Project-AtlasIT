import type { Handle, HandleServerError } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import type { UserPrincipal } from "./lib/auth/provider";
import { matchRoutePermission } from "$lib/server/permissions";
import { validateEncryptionConfig } from "$lib/server/credentials";

let encryptionValidated = false;

/** How often (ms) to refresh session in KV. Reduces writes from every-request to ~1 per 60s. */
const SESSION_REFRESH_INTERVAL_MS = 60 * 1000;

/** Max age (seconds) for the session cache cookie before we re-read KV. */
const SESSION_CACHE_MAX_AGE = 300; // 5 minutes

/**
 * Encode user principal into a base64url cache cookie.
 * Not a security boundary — the atlas_session KV sid is the real auth token.
 * This just avoids a KV read on every request.
 */
function encodeSessionCache(user: UserPrincipal): string {
  return btoa(JSON.stringify(user))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeSessionCache(cookie: string): UserPrincipal | null {
  try {
    const padded = cookie.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded)) as UserPrincipal;
  } catch {
    return null;
  }
}

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
        message:
          "DEV_AUTH_BYPASS is active — this MUST NOT appear in production logs",
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
  const envRaw = event.platform?.env as unknown as Record<
    string,
    string | undefined
  >;
  const envAny = event.platform?.env as Record<string, unknown> | undefined;

  const devBypass = isDevAuthBypass(envRaw ?? {});

  // ------------------------------------------------------------------
  // 1. Authentication is session-based (email/password via /api/auth/login)
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // 2. Session lookup — use cache cookie to avoid KV reads
  // ------------------------------------------------------------------
  if (!user && !devBypass && sessionId) {
    // Try the cache cookie first (no KV read)
    const cachedSession = event.cookies.get("atlas_session_cache");
    if (cachedSession) {
      user = decodeSessionCache(cachedSession);
    }

    // If no cache or cache is stale, fall back to KV
    if (!user) {
      try {
        const kv = envAny?.["KV_SESSIONS"] as KVNamespace | undefined;
        if (kv) {
          const sessionData = await kv.get(sessionId);
          if (sessionData) {
            user = JSON.parse(sessionData) as UserPrincipal;
            // Set cache cookie so next requests skip KV
            event.cookies.set("atlas_session_cache", encodeSessionCache(user), {
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              path: "/",
              maxAge: SESSION_CACHE_MAX_AGE,
            });
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
    }

    // Enrich stale sessions missing tenantId (e.g., created before enrichment was added)
    if (user && !user.tenantId) {
      try {
        const db = envAny?.["ATLAS_SHARED_DB"] as D1Database | undefined;
        if (db) {
          // Try console_user_roles first (RBAC table)
          const roleRow = await db
            .prepare("SELECT tenant_id FROM console_user_roles WHERE email = ? LIMIT 1")
            .bind(user.email)
            .first<{ tenant_id: string }>();
          if (roleRow?.tenant_id) {
            user.tenantId = roleRow.tenant_id;
          }
          // Then console_users
          if (!user.tenantId) {
            const userRow = await db
              .prepare("SELECT tenant_id FROM console_users WHERE email = ? LIMIT 1")
              .bind(user.email)
              .first<{ tenant_id: string }>();
            if (userRow?.tenant_id) user.tenantId = userRow.tenant_id;
          }
          // Then users table (directory users)
          if (!user.tenantId) {
            const dirRow = await db
              .prepare("SELECT tenant_id FROM users WHERE email = ? LIMIT 1")
              .bind(user.email)
              .first<{ tenant_id: string }>();
            if (dirRow?.tenant_id) user.tenantId = dirRow.tenant_id;
          }
          // Last resort: first tenant
          if (!user.tenantId) {
            const fallback = await db
              .prepare("SELECT id FROM tenants LIMIT 1")
              .first<{ id: string }>();
            if (fallback?.id) user.tenantId = fallback.id;
          }
        }
      } catch (e) {
        console.error(JSON.stringify({ level: "error", event: "auth.tenant_enrichment_failed", err: String(e) }));
      }
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
            // Refresh the cache cookie too
            event.cookies.set("atlas_session_cache", encodeSessionCache(user), {
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              path: "/",
              maxAge: SESSION_CACHE_MAX_AGE,
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
  // 4. Centralized RBAC enforcement for API routes
  // ------------------------------------------------------------------
  if (event.url.pathname.startsWith("/api/")) {
    const requiredRoles = matchRoutePermission(
      event.url.pathname,
      event.request.method,
    );

    if (requiredRoles !== undefined) {
      // null = any authenticated user; string[] = specific roles required
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }

      if (requiredRoles !== null) {
        // Super-admins bypass role checks
        if (!user.superAdmin) {
          const userRoles: string[] = user.roles ?? [];
          const hasRole = requiredRoles.some((r) => userRoles.includes(r));
          if (!hasRole) {
            return new Response(
              JSON.stringify({ error: "Insufficient permissions" }),
              { status: 403, headers: { "content-type": "application/json" } },
            );
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
        return new Response(
          JSON.stringify({ error: "unauthorized", code: "auth_required" }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        );
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
  const message =
    error instanceof Error ? error.message : "Internal server error";

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

  // Never expose internal details to the client.
  return { message: "An unexpected error occurred", code: "INTERNAL_ERROR" };
};
