import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { proxyFetch, getWorkerBase } from "../../_proxy-helpers";

export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const base = getWorkerBase(platform);
  const params = new URLSearchParams({ tenant_id: user.tenantId });
  const limit = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor");
  if (limit) params.set("limit", limit);
  if (cursor) params.set("cursor", cursor);

  const res = await proxyFetch(platform, `${base}/api/v1/evidence?${params}`, {
    headers: { "x-tenant-id": user.tenantId },
  });
  const data = await res.json();
  return json(data, { status: res.status });
};

export const POST: RequestHandler = async ({ locals, platform, request }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

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
