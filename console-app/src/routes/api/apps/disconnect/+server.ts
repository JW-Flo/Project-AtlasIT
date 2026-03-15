import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { deleteCredentials } from "$lib/server/credentials";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
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

  return new Response(
    JSON.stringify({ success: true, connected: false, id: appId }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
