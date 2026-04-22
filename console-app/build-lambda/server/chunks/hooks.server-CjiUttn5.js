import { redirect, isRedirect, isHttpError } from '@sveltejs/kit';
import { v as validateEncryptionConfig } from './credentials-CkBYNzQv.js';

const PERMISSIONS = [
  // ── Directory mutations ──────────────────────────────────────────
  {
    pattern: /^\/api\/directory\/users$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/directory\/users\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner"] }
  },
  {
    pattern: /^\/api\/directory\/groups$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/directory\/groups\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner"] }
  },
  {
    pattern: /^\/api\/directory\/groups\/[^/]+\/members$/,
    methods: { POST: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/directory\/sync$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/directory\/connect$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/directory\/mappings$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/directory\/mappings\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  // ── App mutations ────────────────────────────────────────────────
  {
    pattern: /^\/api\/apps\/credentials$/,
    methods: { PUT: ["owner", "admin"], POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/apps\/connect$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/apps\/disconnect$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/apps\/[^/]+\/groups$/,
    methods: { POST: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/apps\/[^/]+\/groups\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/apps\/[^/]+\/roles$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/apps\/[^/]+\/roles\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  // ── Automation ───────────────────────────────────────────────────
  {
    pattern: /^\/api\/automation\/rules$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/automation\/rules\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner"] }
  },
  // ── Tenant user management ──────────────────────────────────────
  {
    pattern: /^\/api\/tenant\/users\/invite$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/tenant\/users\/[^/]+\/role$/,
    methods: { PATCH: ["owner"] }
  },
  {
    pattern: /^\/api\/tenant\/users\/[^/]+$/,
    methods: { PATCH: ["owner"], DELETE: ["owner"] }
  },
  {
    pattern: /^\/api\/tenant\/settings$/,
    methods: { PATCH: ["owner"] }
  },
  {
    pattern: /^\/api\/tenant\/sso$/,
    methods: { POST: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/tenant\/security$/,
    methods: { PUT: ["owner"] }
  },
  // ── Incidents ────────────────────────────────────────────────────
  // Any authenticated user can create an incident
  { pattern: /^\/api\/incidents$/, methods: { POST: null } },
  {
    pattern: /^\/api\/incidents\/[^/]+\/resolve$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/incidents\/[^/]+\/severity$/,
    methods: { PUT: ["owner", "admin", "member"] }
  },
  {
    pattern: /^\/api\/incidents\/sla-config$/,
    methods: { GET: ["owner", "admin"], PUT: ["owner", "admin"] }
  },
  // ── Access requests ──────────────────────────────────────────────
  // Any authenticated user can create a request
  { pattern: /^\/api\/access-requests$/, methods: { POST: null } },
  {
    pattern: /^\/api\/access-requests\/[^/]+\/(approve|deny|fulfill)$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── Lifecycle ────────────────────────────────────────────────────
  {
    pattern: /^\/api\/apps\/lifecycle\/movement$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/apps\/lifecycle\/workflows$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── Evidence ────────────────────────────────────────────────────
  {
    pattern: /^\/api\/tenant-compliance\/evidence$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/tenant-compliance\/evidence\/[^/]+\/link$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── Tenant preferences ─────────────────────────────────────────
  {
    pattern: /^\/api\/tenants\/preferences$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── Roles ───────────────────────────────────────────────────────
  {
    pattern: /^\/api\/roles\/[^/]+\/assignments$/,
    methods: { POST: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/roles\/[^/]+\/entitlements$/,
    methods: { POST: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  // ── Evidence collection ─────────────────────────────────────────
  {
    pattern: /^\/api\/evidence-collection\/collect$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── NHI governance ──────────────────────────────────────────────
  {
    pattern: /^\/api\/nhi$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/nhi\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner", "admin"] }
  },
  // ── Access reviews ──────────────────────────────────────────────
  {
    pattern: /^\/api\/access-reviews\/[^/]+\/items$/,
    methods: { POST: ["owner", "admin"] }
  },
  {
    pattern: /^\/api\/access-reviews\/[^/]+\/decisions$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── Questionnaires ──────────────────────────────────────────────
  {
    pattern: /^\/api\/questionnaires$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── App testing ─────────────────────────────────────────────────
  {
    pattern: /^\/api\/apps\/test$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── Directory mapping suggestions ───────────────────────────────
  {
    pattern: /^\/api\/directory\/mappings\/suggest$/,
    methods: { POST: ["owner", "admin"] }
  },
  // ── Self-service (any authenticated user) ───────────────────────
  {
    pattern: /^\/api\/incidents\/[^/]+\/timeline$/,
    methods: { POST: null }
  },
  {
    pattern: /^\/api\/notifications\/read$/,
    methods: { POST: null }
  },
  {
    pattern: /^\/api\/notifications\/read-all$/,
    methods: { POST: null }
  },
  {
    pattern: /^\/api\/automation\/simulate$/,
    methods: { POST: null }
  },
  {
    pattern: /^\/api\/user\/password$/,
    methods: { PATCH: null }
  },
  // ── Platform (super-admin only — uses "super-admin" role) ───────
  {
    pattern: /^\/api\/platform\/dashboard$/,
    methods: { GET: ["super-admin"] }
  },
  {
    pattern: /^\/api\/platform\/usage$/,
    methods: { GET: ["super-admin"] }
  },
  {
    pattern: /^\/api\/admin\//,
    methods: {
      GET: ["super-admin"],
      POST: ["super-admin"],
      PATCH: ["super-admin"],
      DELETE: ["super-admin"]
    }
  }
];
function matchRoutePermission(pathname, method) {
  for (const route of PERMISSIONS) {
    if (route.pattern.test(pathname)) {
      return route.methods[method];
    }
  }
  return void 0;
}
const BODY_METHODS = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH", "DELETE"]);
function payloadTooLargeResponse() {
  return new Response(
    JSON.stringify({ error: "Payload too large", code: "payload_too_large" }),
    { status: 413, headers: { "content-type": "application/json" } }
  );
}
function parseBodySizeLimit(rawEnvValue, defaultLimit) {
  if (!rawEnvValue) return defaultLimit;
  const parsed = parseInt(rawEnvValue, 10);
  if (!Number.isFinite(parsed)) return defaultLimit;
  if (parsed <= 0) return Infinity;
  return parsed;
}
async function checkBodySizeLimit(request, limitBytes) {
  if (!BODY_METHODS.has(request.method) || !request.body) {
    return { blocked: false, request };
  }
  const clHeader = parseInt(request.headers.get("content-length") ?? "", 10);
  if (!isNaN(clHeader) && clHeader > limitBytes) {
    return { blocked: true, response: payloadTooLargeResponse() };
  }
  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  let oversized = false;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > limitBytes) {
        oversized = true;
        await reader.cancel().catch(() => void 0);
        break;
      }
      chunks.push(value);
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "warn",
        event: "security:body-size-limit.stream-error",
        message: "Body stream read error during size check",
        err: String(err)
      })
    );
  }
  if (oversized) {
    return { blocked: true, response: payloadTooLargeResponse() };
  }
  const assembled = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    assembled.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { blocked: false, request: new Request(request, { body: assembled }) };
}
const BODY_SIZE_LIMIT_DEFAULT = 512 * 1024;
const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  // login, register, SSO, MFA verify
  "/api/health",
  // health checks
  "/api/trust/",
  // public trust center
  "/api/billing/webhook",
  // Stripe webhooks (verified by signature)
  "/api/platform/health",
  // platform status (public)
  "/api/support",
  // public support form submissions
  "/api/privacy/dsar",
  // public data subject access requests
  "/api/demo/"
  // public interactive demo analytics
];
function isPublicApiRoute(pathname) {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
let encryptionValidated = false;
const SESSION_REFRESH_INTERVAL_MS = 3e5;
const KV_CACHE_TTL = 60;
function isDevAuthBypass(env) {
  const devBypass = (env["DEV_AUTH_BYPASS"] ?? "").toLowerCase() === "true" && (env["NODE_ENV"] ?? "").toLowerCase() === "development";
  if (devBypass) {
    console.log(
      JSON.stringify({
        level: "warn",
        event: "auth.dev_bypass_active",
        message: "DEV_AUTH_BYPASS is active — this MUST NOT appear in production logs"
      })
    );
  }
  return devBypass;
}
const handle = async ({ event, resolve }) => {
  if (!encryptionValidated && event.platform?.env) {
    validateEncryptionConfig(event.platform.env);
    encryptionValidated = true;
  }
  const sessionId = event.cookies.get("atlas_session");
  let user = null;
  const envRaw = event.platform?.env;
  const envAny = event.platform?.env;
  const devBypass = isDevAuthBypass(envRaw ?? {});
  if (BODY_METHODS.has(event.request.method) && event.request.body) {
    const bodySizeLimit = parseBodySizeLimit(envRaw?.["BODY_SIZE_LIMIT"], BODY_SIZE_LIMIT_DEFAULT);
    const result = await checkBodySizeLimit(event.request, bodySizeLimit);
    if (result.blocked) {
      return result.response;
    }
    Object.assign(event, { request: result.request });
  }
  if (!user && !devBypass && sessionId) {
    try {
      const kv = envAny?.["KV_SESSIONS"];
      if (kv) {
        const sessionData = await kv.get(sessionId, { cacheTtl: KV_CACHE_TTL });
        if (sessionData) {
          user = JSON.parse(sessionData);
        }
      }
    } catch (e) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "auth.session_lookup_failed",
          err: String(e)
        })
      );
    }
    if (event.cookies.get("atlas_session_cache")) {
      event.cookies.delete("atlas_session_cache", { path: "/" });
    }
    if (user) {
      const superAdminEmail = (envRaw?.["SUPER_ADMIN_EMAIL"] || "").toLowerCase();
      const isSuperByEmail = Boolean(
        superAdminEmail && user.email?.toLowerCase() === superAdminEmail
      );
      const isSuperByRole = (user.roles ?? []).includes("super-admin");
      user.superAdmin = isSuperByEmail || isSuperByRole;
      if (user.superAdmin && !(user.roles ?? []).includes("super-admin")) {
        user.roles = [...user.roles ?? [], "super-admin"];
      }
    }
    if (user && !user.tenantId) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "auth.session_missing_tenant_id",
          message: "Session has no tenantId — invalidating",
          email: user.email
        })
      );
      user = null;
      event.cookies.delete("atlas_session", { path: "/" });
      const isApiRoute = event.url.pathname.startsWith("/api/");
      if (isApiRoute) {
        return new Response(JSON.stringify({ error: "Session invalid", code: "session_invalid" }), {
          status: 401,
          headers: { "content-type": "application/json" }
        });
      }
      throw redirect(302, "/console/login?error=session_invalid");
    }
    if (user) {
      const lastSeen = new Date(user.lastSeenAt).getTime();
      const now = Date.now();
      if (now - lastSeen > SESSION_REFRESH_INTERVAL_MS) {
        user.lastSeenAt = (/* @__PURE__ */ new Date()).toISOString();
        try {
          const kv = envAny?.["KV_SESSIONS"];
          if (kv) {
            await kv.put(sessionId, JSON.stringify(user), {
              expirationTtl: 604800
            });
          }
        } catch {
        }
      }
    }
  }
  if (devBypass && !user) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    user = {
      userId: "dev@localhost",
      email: "dev@localhost",
      roles: ["super-admin"],
      superAdmin: true,
      provider: "dev-bypass",
      tenantId: envRaw?.["DEV_TENANT_ID"] || "dev-tenant",
      createdAt: now,
      lastSeenAt: now
    };
  }
  event.locals.user = user;
  if (user && user.tenantId && !user.superAdmin) {
    try {
      const db = envAny?.["ATLAS_SHARED_DB"];
      if (db) {
        const tenantRow = await db.prepare("SELECT status FROM tenants WHERE id = ? LIMIT 1").bind(user.tenantId).first();
        if (tenantRow?.status === "disabled") {
          const isApiRoute = event.url.pathname.startsWith("/api/");
          if (isApiRoute) {
            return new Response(
              JSON.stringify({ error: "Tenant account is disabled", code: "tenant_disabled" }),
              { status: 403, headers: { "content-type": "application/json" } }
            );
          }
          event.cookies.delete("atlas_session", { path: "/" });
          event.cookies.delete("atlas_session_cache", { path: "/" });
          throw redirect(302, "/console/login?error=tenant_disabled");
        }
      }
    } catch (e) {
      if (isRedirect(e) || isHttpError(e)) throw e;
      console.error(
        JSON.stringify({
          level: "error",
          event: "auth.tenant_status_check_failed",
          err: String(e)
        })
      );
    }
  }
  if (event.url.pathname.startsWith("/api/")) {
    const isPublicRoute = isPublicApiRoute(event.url.pathname);
    if (!isPublicRoute) {
      if (!user) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "content-type": "application/json" }
        });
      }
      const requiredRoles = matchRoutePermission(event.url.pathname, event.request.method);
      if (requiredRoles !== void 0 && requiredRoles !== null) {
        if (!user.superAdmin) {
          const userRoles = user.roles ?? [];
          const hasRole = requiredRoles.some((r) => userRoles.includes(r));
          if (!hasRole) {
            return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
              status: 403,
              headers: { "content-type": "application/json" }
            });
          }
        }
      }
    }
  }
  if (event.url.pathname.startsWith("/console") && !event.url.pathname.startsWith("/console/login") && !event.url.pathname.startsWith("/console/onboarding")) {
    if (!user) {
      if (event.url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "unauthorized", code: "auth_required" }), {
          status: 401,
          headers: { "content-type": "application/json" }
        });
      }
      throw redirect(302, "/console/login");
    }
  }
  return resolve(event);
};
const handleError = ({ error, event }) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  console.error(
    JSON.stringify({
      level: "error",
      event: "request.unhandled_error",
      message,
      path: event.url.pathname,
      method: event.request.method,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    })
  );
  const debug = event.url.searchParams.get("_debug") === "1";
  const user = event.locals.user;
  const isSuperAdmin = Boolean(user?.superAdmin || (user?.roles ?? []).includes("super-admin"));
  const isProduction = event.platform?.env?.["NODE_ENV"] !== "development";
  if (debug && isSuperAdmin) {
    if (isProduction) {
      return { message, code: "INTERNAL_ERROR" };
    }
    const stack = error instanceof Error ? error.stack : String(error);
    return {
      message: `${message} | ${(stack || "").split("\n").slice(0, 3).join(" ")}`,
      code: "INTERNAL_ERROR"
    };
  }
  return { message: "An unexpected error occurred", code: "INTERNAL_ERROR" };
};

export { handle, handleError };
//# sourceMappingURL=hooks.server-CjiUttn5.js.map
