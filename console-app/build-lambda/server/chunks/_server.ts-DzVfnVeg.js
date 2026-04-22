import { json } from '@sveltejs/kit';
import { g as getWorkerBase, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';

const GET = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const base = getWorkerBase(platform);
  const params = new URLSearchParams({ tenant_id: user.tenantId });
  const limit = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor");
  if (limit) params.set("limit", limit);
  if (cursor) params.set("cursor", cursor);
  const res = await proxyFetch(platform, `${base}/api/v1/evidence?${params}`, {
    headers: { "x-tenant-id": user.tenantId }
  });
  const data = await res.json();
  return json(data, { status: res.status });
};
const POST = async ({ locals, platform, request }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user;
  const body = await request.json();
  const base = getWorkerBase(platform);
  const res = await proxyFetch(platform, `${base}/api/v1/evidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": user.tenantId
    },
    body: JSON.stringify({ ...body, tenantId: user.tenantId })
  });
  const data = await res.json();
  return json(data, { status: res.status });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-DzVfnVeg.js.map
