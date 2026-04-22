import { g as getWorkerBase, a as getEnv, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';

const POST = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    const json = await request.json();
    body = JSON.stringify(json);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const upstream = `${base}/api/v1/notifications/read`;
    const res = await proxyFetch(platform, upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId
      },
      body
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Notifications service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
};

export { POST };
//# sourceMappingURL=_server.ts-DnZqqH9J.js.map
