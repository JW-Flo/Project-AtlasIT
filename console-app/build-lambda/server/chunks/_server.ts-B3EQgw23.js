import { c as coreFetch } from './api-IZoNGiDX.js';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import '@sveltejs/kit';

const POST = async ({ request, platform, locals }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const env = platform?.env || {};
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const res = await coreFetch(env, "/api/v1/apps/lifecycle/movement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ error: "Lifecycle movement service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-B3EQgw23.js.map
