function getWorkerBase(platform) {
  const env = platform?.env || {};
  const complianceBase = env.COMPLIANCE_BASE || "https://compliance.atlasit.pro";
  return complianceBase.replace(/\/api\/compliance\/?$/, "").replace(/\/$/, "");
}
function getEnv(platform) {
  return platform?.env || {};
}
async function proxyFetch(platform, url, init) {
  const env = getEnv(platform);
  const apiKey = env.INTERNAL_API_KEY || env.COMPLIANCE_API_KEY || "";
  if (apiKey && init?.headers) {
    const headers = new Headers(init.headers);
    if (!headers.has("x-api-key")) {
      headers.set("x-api-key", apiKey);
    }
    init = { ...init, headers };
  } else if (apiKey && !init?.headers) {
    init = { ...init, headers: { "x-api-key": apiKey } };
  }
  if (env.COMPLIANCE_WORKER) {
    return env.COMPLIANCE_WORKER.fetch(new Request(url, init));
  }
  return fetch(url, init);
}
async function safeProxyFetch(platform, url, init) {
  const correlationId = crypto.randomUUID();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const response = await proxyFetch(platform, url, init);
    if (!response.ok) {
      let upstreamMessage = "Upstream service error";
      try {
        const body = await response.json();
        upstreamMessage = body.message ?? body.error ?? upstreamMessage;
      } catch {
      }
      return {
        ok: false,
        errorResponse: new Response(
          JSON.stringify({
            status: "error",
            code: response.status === 404 ? "NOT_FOUND" : "UPSTREAM_ERROR",
            message: upstreamMessage,
            correlationId,
            timestamp
          }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" }
          }
        )
      };
    }
    return { ok: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Service unavailable";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        code: "PROXY_ERROR",
        message,
        timestamp
      })
    );
    return {
      ok: false,
      errorResponse: new Response(
        JSON.stringify({
          status: "error",
          code: "PROXY_ERROR",
          message: "Service temporarily unavailable",
          correlationId,
          timestamp
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      )
    };
  }
}

export { getEnv as a, getWorkerBase as g, proxyFetch as p, safeProxyFetch as s };
//# sourceMappingURL=_proxy-helpers-Bn_aZrFz.js.map
