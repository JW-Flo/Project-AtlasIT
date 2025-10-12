import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { activeProviders, type UserPrincipal } from "./lib/auth/provider";

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get("atlas_session");
  let user = null;
  // Cast env to any to allow reading optional flag without polluting global types
  const envAny = event.platform?.env as any;
  const disableAuth =
    (envAny?.DISABLE_CONSOLE_AUTH || "").toLowerCase() === "true";
  const useCfAccess = (envAny?.USE_CF_ACCESS || "").toLowerCase() === "true";
  const superAdminEmail = envAny?.SUPER_ADMIN_EMAIL;

  // Provider resolution (e.g., Cloudflare Access; future: OIDC)
  if (useCfAccess && !sessionId) {
    for (const p of activeProviders) {
      try {
        const resolved = await p.resolve({
          headers: event.request.headers,
          env: envAny,
          kv: event.platform?.env?.KV_SESSIONS,
        });
        if (resolved) {
          user = resolved;
          // Persist minimal session
            const sid = crypto.randomUUID();
            const kv = event.platform?.env?.KV_SESSIONS;
            if (kv) {
              await kv.put(sid, JSON.stringify(user));
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
        console.error("Auth provider error", { provider: p.name, err });
      }
    }
  }

  if (sessionId) {
    try {
      const kv = event.platform?.env?.KV_SESSIONS;
      if (kv) {
        const sessionData = await kv.get(sessionId);
        if (sessionData) {
          user = JSON.parse(sessionData);
          // Update last seen
          user.lastSeenAt = new Date().toISOString();
          await kv.put(sessionId, JSON.stringify(user));
        }
      }
    } catch (e) {
      console.error("Session lookup failed:", e);
    }
  }

  event.locals.user = user;

  // Structured log (avoid PII beyond email)
  try {
    const accessEmail = event.request.headers.get(
      "cf-access-authenticated-user-email"
    );
    if (accessEmail) {
      console.log(
        JSON.stringify({
          level: "debug",
          event: "auth.request",
          accessEmail,
          matched: !!user,
          provider: user?.provider || null,
          path: event.url.pathname,
        })
      );
    }
  } catch {}
  // Protect /console/* except /console/login
  if (!disableAuth) {
    if (
      event.url.pathname.startsWith("/console") &&
      !event.url.pathname.startsWith("/console/login")
    ) {
      if (!user) {
        throw redirect(302, "/console/login");
      }
    }
  }

  return resolve(event);
};
