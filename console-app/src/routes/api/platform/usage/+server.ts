import type { RequestHandler } from "@sveltejs/kit";
import { dispatchFetch } from "$lib/api";
import type { PlatformUsageSummary } from "$lib/types/platform";

export const GET: RequestHandler = async ({ platform }) => {
  const env: any = platform?.env || {};
  if (!env.DISPATCH_ADMIN_TOKEN) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_admin_token" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  try {
    const resp = await dispatchFetch(env, "/admin/usage/summary", {
      headers: { Authorization: `Bearer ${env.DISPATCH_ADMIN_TOKEN}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, error: data }), {
        status: resp.status,
        headers: { "content-type": "application/json" },
      });
    }
    // Sanitize: remove any internal tokens, keep only public fields
    const sanitized: PlatformUsageSummary = {
      ok: true,
      total: data.total,
      failures: data.failures,
      failureRate: data.failureRate,
      tenants: data.tenants,
      breakerOpenScripts: data.breakerOpenScripts || 0,
      topScripts: data.topScripts || [],
    };
    return new Response(JSON.stringify(sanitized), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
