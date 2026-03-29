import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { proxyFetch, getWorkerBase } from "../../_proxy-helpers";

export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const base = getWorkerBase(platform);
  const params = new URLSearchParams({ tenantId: user.tenantId });

  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");
  const since = url.searchParams.get("since");
  const source = url.searchParams.get("source");
  const controlTag = url.searchParams.get("controlTag");

  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);
  if (since) params.set("since", since);
  if (source) params.set("source", source);
  if (controlTag) params.set("controlTag", controlTag);

  const res = await proxyFetch(
    platform,
    `${base}/api/compliance/evidence-feed?${params}`,
    { headers: { "x-tenant-id": user.tenantId } },
  );
  const data = await res.json();
  return json(data, { status: res.status });
};
