import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { saveCredentials } from "$lib/server/credentials";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required" }, { status: 403 });
  }
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

  const credentials: Record<string, string> = body.credentials || {};

  const result = await saveCredentials(platform, appId, credentials, tenantId);

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: result.error || "Failed to save credentials" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, connected: true, id: appId }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
