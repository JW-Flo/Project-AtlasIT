import type { RequestHandler } from "@sveltejs/kit";
import { coreFetch } from "$lib/api";

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = (platform?.env as any) || {};

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.appId) {
    return new Response(JSON.stringify({ error: "appId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await coreFetch(env, "/api/v1/apps/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Test service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
