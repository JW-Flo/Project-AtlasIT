import type { RequestHandler } from "@sveltejs/kit";
import { coreFetch } from "$lib/api";

export const GET: RequestHandler = async ({ platform }) => {
  const env = (platform?.env as any) || {};

  try {
    const res = await coreFetch(env, "/api/v1/apps/status");
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "App status service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
};
