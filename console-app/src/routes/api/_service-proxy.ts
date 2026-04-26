import type { RequestEvent } from "@sveltejs/kit";
import {
  getCoreApiBase,
  getEnv,
  getOrchestratorBase,
  getWorkerBase,
  proxyFetch,
} from "./_proxy-helpers";

type ServiceTarget = "core" | "compliance" | "orchestrator";

function baseFor(platform: RequestEvent["platform"], target: ServiceTarget): string {
  if (target === "compliance") return getWorkerBase(platform);
  if (target === "orchestrator") return getOrchestratorBase(platform);
  return getCoreApiBase(platform);
}

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  const cacheControl = upstream.headers.get("cache-control");
  if (contentType) headers.set("content-type", contentType);
  if (cacheControl) headers.set("cache-control", cacheControl);
  return headers;
}

export async function proxyServiceRequest(
  event: RequestEvent,
  target: ServiceTarget,
  upstreamPath: string,
): Promise<Response> {
  const user = event.locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const env = getEnv(event.platform);
  const internalKey = env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY || "";
  if (!internalKey) {
    return new Response(JSON.stringify({ error: "Internal API key is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  const upstream = `${baseFor(event.platform, target)}${upstreamPath}${event.url.search}`;
  const headers = new Headers(event.request.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.set("x-tenant-id", tenantId);
  headers.set("x-internal-api-key", internalKey);
  headers.set("x-api-key", internalKey);
  if (!headers.has("x-correlation-id")) headers.set("x-correlation-id", crypto.randomUUID());

  const method = event.request.method.toUpperCase();
  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await event.request.arrayBuffer();
  }

  try {
    const res = await proxyFetch(event.platform, upstream, init);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders(res),
    });
  } catch (err) {
    console.error("service_proxy_error", {
      target,
      upstreamPath,
      message: err instanceof Error ? err.message : String(err),
    });
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
}
