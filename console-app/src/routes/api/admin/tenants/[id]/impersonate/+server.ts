import type { RequestHandler } from "@sveltejs/kit";
import { getCoreApiBase, getEnv, proxyFetch } from "../../../../_proxy-helpers";

export const POST: RequestHandler = async ({ params, cookies, platform, locals }) => {
  const user = locals.user;
  if (!user?.superAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getCoreApiBase(platform);
  const env = getEnv(platform);
  const { id } = params;
  const currentSessionId = cookies.get("atlas_session") ?? "";
  const upstream = `${base}/api/v1/tenants/${id}/impersonate`;

  try {
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
        "x-user-id": user.userId,
        "x-original-session-id": currentSessionId,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    // If successful, the Lambda should return a new session ID
    if (res.ok && data.sessionId) {
      cookies.set("atlas_session", data.sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 900,
      });

      // Clear session cache
      cookies.set("atlas_session_cache", "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
