import type { RequestHandler } from "@sveltejs/kit";
import { getCoreApiBase, getEnv, proxyFetch } from "../../../_proxy-helpers";

export const PATCH: RequestHandler = async ({ params, request, platform, locals }) => {
  const user = locals.user;
  if (!user?.superAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = getCoreApiBase(platform);
  const env = getEnv(platform);
  const body = await request.text();
  const { id } = params;
  const upstream = `${base}/api/v1/tenants/${id}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      method: "PATCH",
      headers: {
        "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
        "x-user-id": user.userId,
        "Content-Type": "application/json",
      },
      body,
    });
    const data = await res.json();
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

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
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
  const upstream = `${base}/api/v1/tenants/${id}`;

  try {
    const res = await proxyFetch(platform, upstream, {
      method: "DELETE",
      headers: {
        "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
        "x-user-id": user.userId,
      },
    });
    const data = await res.json();
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
