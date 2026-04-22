import { json } from '@sveltejs/kit';

const MARKETPLACE_BASE = "https://marketplace.atlasit.pro";
function getMarketplaceBase(platform) {
  const env = platform?.env || {};
  return env.MARKETPLACE_BASE || MARKETPLACE_BASE;
}
async function proxyToMarketplace(platform, path, init) {
  const base = getMarketplaceBase(platform);
  const url = `${base}${path}`;
  const env = platform?.env || {};
  if (env.MARKETPLACE_WORKER) {
    return env.MARKETPLACE_WORKER.fetch(new Request(url, init));
  }
  return fetch(url, init);
}
const GET = async ({ url, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = locals.user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required" }, { status: 403 });
  }
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);
  const qs = params.toString();
  const path = `/api/v1/apps${qs ? `?${qs}` : ""}`;
  try {
    const resp = await proxyToMarketplace(platform, path, {
      headers: { "x-tenant-id": tenantId }
    });
    const data = await resp.json();
    return json(data, { status: resp.status });
  } catch {
    return json(
      {
        status: "error",
        code: "PROXY_FAILED",
        message: "Failed to reach marketplace service"
      },
      { status: 502 }
    );
  }
};

export { GET };
//# sourceMappingURL=_server.ts-DUZXnpv6.js.map
