import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { activeProviders, type UserPrincipal } from "./lib/auth/provider";

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
  // 1. Provider resolution (Cloudflare Access JWT)
  // ------------------------------------------------------------------
  if (!devBypass && !sessionId) {
    for (const p of activeProviders) {
      try {
        const resolved = await p.resolve({
          headers: event.request.headers,
          env: {
            CF_ACCESS_AUD: envRaw?.["CF_ACCESS_AUD"],
            CF_ACCESS_TEAM_DOMAIN: envRaw?.["CF_ACCESS_TEAM_DOMAIN"],
            ALLOWED_ACCESS_EMAILS: envRaw?.["ALLOWED_ACCESS_EMAILS"],
            SUPER_ADMIN_EMAIL: envRaw?.["SUPER_ADMIN_EMAIL"],
          },
          kv: envAny?.["KV_SESSIONS"] as KVNamespace | undefined,
        });
        if (resolved) {
          user = resolved;
          // Persist minimal session in KV so subsequent requests do not
          // re-validate the JWT (certs fetch is cached by the runtime, but
          // still best to avoid repeated signature verification).
          const sid = crypto.randomUUID();
          const kv = envAny?.["KV_SESSIONS"] as KVNamespace | undefined;
          if (kv) {
            await kv.put(sid, JSON.stringify(user), { expirationTtl: 604800 });
            event.cookies.set("atlas_session", sid, {
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              path: "/",
              maxAge: 604800,
            });
          }
          break;
        }
      } catch (err) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "auth.provider_error",
            provider: p.name,
            err: String(err),
          }),
        );
      }
    }
  }

  // ------------------------------------------------------------------
  // 2. Session lookup (user already authenticated in a prior request)
  // ------------------------------------------------------------------
  if (!user && !devBypass && sessionId) {
    try {
      const kv = envAny?.["KV_SESSIONS"] as KVNamespace | undefined;
      if (kv) {
        const sessionData = await kv.get(sessionId);
        if (sessionData) {
          user = JSON.parse(sessionData) as UserPrincipal;
          // Refresh lastSeenAt
          user.lastSeenAt = new Date().toISOString();
          await kv.put(sessionId, JSON.stringify(user), {
            expirationTtl: 604800,
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
      createdAt: now,
      lastSeenAt: now,
    };
  }

  event.locals.user = user;

  // ------------------------------------------------------------------
  // 4. Structured auth decision log (no PII beyond email)
  // ------------------------------------------------------------------
  try {
    const jwtHeader = event.request.headers.get("cf-access-jwt-assertion");
    const accessEmail = event.request.headers.get(
      "cf-access-authenticated-user-email",
    );
    if (jwtHeader || accessEmail) {
      console.log(
        JSON.stringify({
          level: "info",
          event: "auth.request",
          accessEmail: accessEmail ?? null,
          jwtPresent: !!jwtHeader,
          authenticated: !!user,
          provider: user?.provider ?? null,
          path: event.url.pathname,
          method: event.request.method,
          ts: new Date().toISOString(),
        }),
      );
    }
  } catch {
    // Logging must never block the request
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
