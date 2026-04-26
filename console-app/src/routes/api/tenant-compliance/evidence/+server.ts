import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { evidenceData } from "$lib/server/dashboard-compat";
import { requireTenantRole } from "$lib/server/guards";
import { proxyFetch, getWorkerBase } from "../../_proxy-helpers";

export const GET: RequestHandler = async ({ locals, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  if (!user.tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  return json(await evidenceData(user.tenantId, url));
};

export const POST: RequestHandler = async ({ locals, platform, request }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user!;

  const body = await request.json();
  const base = getWorkerBase(platform);
  const res = await proxyFetch(platform, `${base}/api/v1/evidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": user.tenantId,
    },
    body: JSON.stringify({ ...body, tenantId: user.tenantId }),
  });
  const data = await res.json();
  return json(data, { status: res.status });
};
