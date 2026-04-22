import { a as requireSuperAdmin } from './guards-rSzq6XQW.js';
import { d as dispatchFetch } from './api-IZoNGiDX.js';
import '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;
  const env = platform?.env || {};
  if (!env.DISPATCH_ADMIN_TOKEN) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_admin_token" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
  try {
    const resp = await dispatchFetch(env, "/admin/usage/summary", {
      headers: {
        "x-admin-token": String(env.DISPATCH_ADMIN_TOKEN),
        Authorization: `Bearer ${env.DISPATCH_ADMIN_TOKEN}`
      }
    });
    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, error: data }), {
        status: resp.status,
        headers: { "content-type": "application/json" }
      });
    }
    const sanitized = {
      ok: true,
      total: typeof data["total"] === "number" ? data["total"] : void 0,
      failures: typeof data["failures"] === "number" ? data["failures"] : void 0,
      failureRate: typeof data["failureRate"] === "number" ? data["failureRate"] : void 0,
      tenants: typeof data["tenants"] === "number" ? data["tenants"] : void 0,
      breakerOpenScripts: typeof data["breakerOpenScripts"] === "number" ? data["breakerOpenScripts"] : 0,
      topScripts: Array.isArray(data["topScripts"]) ? data["topScripts"] : []
    };
    return new Response(JSON.stringify(sanitized), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-Cylpa9R-.js.map
