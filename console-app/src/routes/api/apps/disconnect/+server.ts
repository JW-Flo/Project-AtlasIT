import type { RequestHandler } from "@sveltejs/kit";
import { deleteCredentials } from "$lib/server/credentials";

export const POST: RequestHandler = async ({ request, platform }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const appId = body.appId;
  if (!appId) {
    return new Response(JSON.stringify({ error: "appId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await deleteCredentials(platform, appId);

  return new Response(JSON.stringify({ connected: false, id: appId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
