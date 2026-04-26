import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { tenantSettingsData } from "$lib/server/dashboard-compat";
import { getCoreApiBase, getEnv, proxyFetch } from "../../_proxy-helpers";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  if (!user.tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const settings = await tenantSettingsData(user.tenantId);
  return settings ? json(settings) : json({ error: "Tenant not found" }, { status: 404 });
};

export const PATCH: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  if (!user.tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const base = getCoreApiBase(platform);
  const env = getEnv(platform);
  const res = await proxyFetch(platform, `${base}/api/v1/tenant/settings`, {
    method: "PATCH",
    headers: {
      "x-api-key": env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY,
      "x-tenant-id": user.tenantId,
      "Content-Type": "application/json",
    },
    body: await request.text(),
  });
  const data = await res.json().catch(() => ({}));
  return json(data, { status: res.status });
};
