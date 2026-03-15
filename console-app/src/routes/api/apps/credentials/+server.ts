import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { saveCredentials, getCredentials } from "$lib/server/credentials";

export const PUT: RequestHandler = async ({ request, platform, locals }) => {
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

  if (!body.appId) {
    return new Response(JSON.stringify({ error: "appId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const credentials: Record<string, string> = body.credentials || {};

  // Merge with existing credentials (empty fields = keep existing)
  const existing = await getCredentials(platform, body.appId, tenantId);
  if (existing) {
    for (const [key, value] of Object.entries(existing)) {
      if (!credentials[key]) {
        credentials[key] = value;
      }
    }
  }

  const result = await saveCredentials(
    platform,
    body.appId,
    credentials,
    tenantId,
  );

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: result.error || "Failed to save" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ success: true, appId: body.appId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
