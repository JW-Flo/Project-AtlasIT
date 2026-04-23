export function getWorkerBase(platform: any): string {
  const env = (platform?.env as any) || {};
  const complianceBase: string = env.COMPLIANCE_BASE || "https://compliance.atlasit.pro";
  return complianceBase.replace(/\/api\/compliance\/?$/, "").replace(/\/$/, "");
}

export function getCoreApiBase(platform: any): string {
  const env = (platform?.env as any) || {};
  return (env.CORE_API_BASE || "https://core-api.atlasit.pro").replace(/\/$/, "");
}

export function getOrchestratorBase(platform: any): string {
  const env = (platform?.env as any) || {};
  return (env.ORCHESTRATOR_BASE || "https://orchestrator.atlasit.pro").replace(/\/$/, "");
}

export function getEnv(platform: any): Record<string, any> {
  return (platform?.env as any) || {};
}

export async function proxyFetch(
  platform: any,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const env = getEnv(platform);
  // Inject API key for authenticated inter-service calls
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

export type ProxyResult =
  | {
      ok: true;
      response: Response;
    }
  | {
      ok: false;
      errorResponse: Response;
    };

export async function safeProxyFetch(
  platform: any,
  url: string,
  init?: RequestInit,
): Promise<ProxyResult> {
  const correlationId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const response = await proxyFetch(platform, url, init);

    if (!response.ok) {
      let upstreamMessage = "Upstream service error";
      try {
        const body = (await response.json()) as Record<string, unknown>;
        upstreamMessage = (body.message ?? body.error ?? upstreamMessage) as string;
      } catch {
        // body wasn't JSON — use default message
      }

      return {
        ok: false,
        errorResponse: new Response(
          JSON.stringify({
            status: "error" as const,
            code: response.status === 404 ? "NOT_FOUND" : "UPSTREAM_ERROR",
            message: upstreamMessage,
            correlationId,
            timestamp,
          }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          },
        ),
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
        timestamp,
      }),
    );
    return {
      ok: false,
      errorResponse: new Response(
        JSON.stringify({
          status: "error" as const,
          code: "PROXY_ERROR",
          message: "Service temporarily unavailable",
          correlationId,
          timestamp,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }
}
