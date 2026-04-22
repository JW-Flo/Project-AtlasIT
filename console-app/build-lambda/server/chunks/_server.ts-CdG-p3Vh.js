import { json } from '@sveltejs/kit';
import { g as getWorkerBase, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';

const POST = async ({ locals, platform, params, request }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user;
  const body = await request.json();
  const base = getWorkerBase(platform);
  const res = await proxyFetch(platform, `${base}/api/v1/evidence/${params.id}/link`, {
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

export { POST };
//# sourceMappingURL=_server.ts-CdG-p3Vh.js.map
