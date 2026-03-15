import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { proxyFetch, getWorkerBase } from "../../../../_proxy-helpers";

export const POST: RequestHandler = async ({
  locals,
  platform,
  params,
  request,
}) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const base = getWorkerBase(platform);
  const res = await proxyFetch(
    platform,
    `${base}/api/v1/evidence/${params.id}/link`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": user.tenantId,
      },
      body: JSON.stringify({ ...body, tenantId: user.tenantId }),
    },
  );
  const data = await res.json();
  return json(data, { status: res.status });
};
