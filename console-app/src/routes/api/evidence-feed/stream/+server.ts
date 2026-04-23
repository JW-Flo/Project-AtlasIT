import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../_proxy-helpers";

export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response("Tenant context required", { status: 403 });
  }
  const upstream = `${base}/api/v1/stream/evidence${url.search}`;
  try {
    const res = await proxyFetch(platform, upstream, {
      headers: { "x-api-key": env.COMPLIANCE_API_KEY, "x-tenant-id": tenantId },
    });
    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response("event: error\ndata: Service unavailable\n\n", {
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  }
};
