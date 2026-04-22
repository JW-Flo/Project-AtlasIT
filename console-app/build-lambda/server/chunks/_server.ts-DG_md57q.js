import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { g as getCredentials, s as saveCredentials } from './credentials-CkBYNzQv.js';

const PUT = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: "Authentication required. Please sign in again." }, { status: 401 });
  }
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required. Contact your administrator." }, { status: 403 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request data. Please check your input." }, { status: 400 });
  }
  if (!body.appId) {
    return json(
      { error: "Application ID is required. Please specify which app to configure." },
      { status: 422 }
    );
  }
  try {
    const credentials = body.credentials || {};
    const existing = await getCredentials(platform, body.appId, tenantId);
    if (existing) {
      for (const [key, value] of Object.entries(existing)) {
        if (!credentials[key]) {
          credentials[key] = value;
        }
      }
    }
    const result = await saveCredentials(platform, body.appId, credentials, tenantId);
    if (!result.ok) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Failed to save credentials",
          tenantId,
          appId: body.appId,
          error: result.error
        })
      );
      return json({ error: "Failed to save credentials. Please try again." }, { status: 500 });
    }
    return json({ success: true, appId: body.appId });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Credential save operation failed",
        tenantId,
        error: String(error)
      })
    );
    return json({ error: "Failed to save credentials. Please try again." }, { status: 500 });
  }
};

export { PUT };
//# sourceMappingURL=_server.ts-DG_md57q.js.map
