import type { RequestHandler } from "@sveltejs/kit";
import { requireSuperAdmin } from "$lib/server/guards";
import { dispatchFetch } from "$lib/api";
import type { PlatformUsageSummary } from "$lib/types/platform";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;
  const env: any = platform?.env || {};
  if (!env.DISPATCH_ADMIN_TOKEN) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_admin_token" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  try {
    // Dispatch admin endpoint expects header x-admin-token matching its env.DISPATCH_ADMIN_TOKEN
    // Keep Authorization as optional backward-compat signal, but primary is x-admin-token.
    const resp = await dispatchFetch(env, "/admin/usage/summary", {
      headers: {
        "x-admin-token": String(env.DISPATCH_ADMIN_TOKEN),
        Authorization: `Bearer ${env.DISPATCH_ADMIN_TOKEN}`,
      },
    });
    const data = (await resp.json()) as Record<string, unknown>;
    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, error: data }), {
        status: resp.status,
        headers: { "content-type": "application/json" },
      });
    }
    // Sanitize: remove any internal tokens, keep only public fields
    const sanitized: PlatformUsageSummary = {
      ok: true,
      total: typeof data["total"] === "number" ? data["total"] : undefined,
      failures:
        typeof data["failures"] === "number" ? data["failures"] : undefined,
      failureRate:
        typeof data["failureRate"] === "number"
          ? data["failureRate"]
          : undefined,
      tenants:
        typeof data["tenants"] === "number" ? data["tenants"] : undefined,
      breakerOpenScripts:
        typeof data["breakerOpenScripts"] === "number"
          ? data["breakerOpenScripts"]
          : 0,
      topScripts: Array.isArray(data["topScripts"])
        ? (data["topScripts"] as Array<{ name: string; invocations: number }>)
        : [],
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
