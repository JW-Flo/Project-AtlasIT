import {
  handleOnboarding,
  generateOnboardingQuestions,
} from "./handlers/onboarding";
import { Env } from "./types";
import { handleError } from "./utils/error";
import {
  logger,
  validateEnv,
  commonEnvSpec,
  resolveCfApiToken,
} from "@atlasit/shared";
import { OnboardingErrors } from "./utils/errors";
import { createSession, getSessionByTenant } from "./services/session-store";

// NOTE: Env validation integration deferred to Phase 1 (tracked in sprint backlog)

let envValidated = false;
// In-memory rate limit state (per isolate)
const rateLimits: Map<string, { windowStart: number; count: number }> =
  new Map();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    resolveCfApiToken(env as any);
    const corsHeaders = getCorsHeaders();
    if (request.method === "OPTIONS")
      return new Response(null, { headers: corsHeaders });

    // Correlation ID generation (per request)
    const requestId = crypto.randomUUID();
    // Attach to global logger context by emitting a debug line early (lightweight)
    logger.debug("request.start", {
      requestId,
      method: request.method,
      path: url.pathname,
    });

    // API Key Authentication (Phase Hardening)
    const allowedKeys = (env.API_ALLOWED_KEYS || "")
      .split(",")
      .map((k: string) => k.trim())
      .filter(Boolean);
    let actor: string | undefined;
    if (allowedKeys.length > 0) {
      const provided = request.headers.get("x-api-key");
      if (!provided || !allowedKeys.includes(provided)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      actor = provided; // MVP actor attribution = raw API key (consider hashing later)
    }

    if (!envValidated) {
      try {
        validateEnv(commonEnvSpec as any, env as any);
      } catch (e) {
        if (logger && typeof logger.warn === "function")
          logger.warn("Env validation warning (non-fatal)", {
            error: String(e),
            requestId,
          });
      } finally {
        envValidated = true; // Avoid repeated validation
      }
    }

    try {
      // Rate limiting (per API key) skipped for health endpoint
      const isHealth = url.pathname === "/health";
      if (!isHealth && actor) {
        const max = parseInt(env.RATE_LIMIT_MAX_REQUESTS || "0", 10) || 0;
        const windowSec =
          parseInt(env.RATE_LIMIT_WINDOW_SECONDS || "0", 10) || 0;
        if (max > 0 && windowSec > 0) {
          const now = Date.now();
          const key = actor;
          const entry = rateLimits.get(key) || { windowStart: now, count: 0 };
          if (now - entry.windowStart >= windowSec * 1000) {
            entry.windowStart = now;
            entry.count = 0;
          }
          entry.count += 1;
          rateLimits.set(key, entry);
          if (entry.count > max) {
            const resetIn =
              windowSec - Math.floor((now - entry.windowStart) / 1000);
            const limitHeaders = {
              "X-RateLimit-Limit": String(max),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(resetIn),
              ...corsHeaders,
            };
            return new Response(
              JSON.stringify({
                error: "Rate limit exceeded",
                limit: max,
                remaining: 0,
                reset: resetIn,
                requestId,
                actor,
              }),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  ...limitHeaders,
                },
              },
            );
          }
        }
      }

      const routeResponse = await routeRequest(
        request,
        url,
        env,
        corsHeaders,
        requestId,
        actor,
      );
      // Inject rate limit headers if applicable
      if (actor && routeResponse) {
        const max = parseInt(env.RATE_LIMIT_MAX_REQUESTS || "0", 10) || 0;
        const windowSec =
          parseInt(env.RATE_LIMIT_WINDOW_SECONDS || "0", 10) || 0;
        if (max > 0 && windowSec > 0) {
          const entry = rateLimits.get(actor);
          if (entry) {
            const now = Date.now();
            const resetIn =
              windowSec - Math.floor((now - entry.windowStart) / 1000);
            routeResponse.headers.set("X-RateLimit-Limit", String(max));
            routeResponse.headers.set(
              "X-RateLimit-Remaining",
              String(Math.max(0, max - entry.count)),
            );
            routeResponse.headers.set("X-RateLimit-Reset", String(resetIn));
          }
        }
      }
      if (routeResponse) return routeResponse;
      return notFound(url, request.method, corsHeaders, requestId);
    } catch (error) {
      console.error("Unhandled error:", error, { requestId });
      return handleError(error);
    }
  },
};

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  } as const;
}

async function routeRequest(
  request: Request,
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>,
  requestId: string,
  actor?: string,
) {
  if (url.pathname === "/health") return handleHealth(corsHeaders, requestId);
  if (isStart(url, request))
    return handleStart(request, env, corsHeaders, requestId, actor);
  if (isSubmit(url, request))
    return handleSubmit(request, env, corsHeaders, requestId, actor);
  if (isQuestions(url, request))
    return handleQuestions(url, corsHeaders, requestId, actor);
  if (isStatus(url, request))
    return handleStatus(url, env, corsHeaders, requestId, actor);
  return null;
}

function handleHealth(cors: Record<string, string>, requestId: string) {
  logger.info("Health check", { requestId });
  return json(
    {
      status: "healthy",
      service: "onboarding",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      requestId,
    },
    cors,
  );
}
function isStart(url: URL, req: Request) {
  return url.pathname === "/onboarding/start" && req.method === "POST";
}
async function handleStart(
  request: Request,
  env: Env,
  cors: Record<string, string>,
  requestId: string,
  actor?: string,
) {
  interface StartBody {
    tenantId?: string;
    industry?: string;
    requirements?: string[];
  }
  const body = (await request.json().catch(() => ({}))) as StartBody;
  const industry = body.industry || "general";
  const requirements = body.requirements || [];
  const questions = await generateOnboardingQuestions(industry, requirements);

  let sessionId: string | undefined;
  if (body.tenantId) {
    sessionId = await createSession(
      env.DB,
      body.tenantId,
      industry,
      requirements,
    );
  }

  return json(
    { sessionId, questions, version: "1.0.0", requestId, actor },
    cors,
  );
}
function isSubmit(url: URL, req: Request) {
  return (
    (url.pathname === "/onboarding/submit" ||
      url.pathname === "/api/onboarding") &&
    req.method === "POST"
  );
}
async function handleSubmit(
  request: Request,
  env: Env,
  cors: Record<string, string>,
  requestId: string,
  actor?: string,
) {
  // Clone request with x-request-id header so handler can access it
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  if (actor) headers.set("x-actor", actor);
  const cloned = new Request(request, { headers });
  const response = await handleOnboarding(cloned, env);
  Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
  response.headers.set("x-request-id", requestId);
  if (actor) response.headers.set("x-actor", actor);
  return response;
}
function isQuestions(url: URL, req: Request) {
  return url.pathname === "/api/onboarding/questions" && req.method === "GET";
}
async function handleQuestions(
  url: URL,
  cors: Record<string, string>,
  requestId: string,
  actor?: string,
) {
  const industry = url.searchParams.get("industry") || "technology";
  const reqParams = url.searchParams.getAll("req");
  const reqCsv = url.searchParams.get("requirements");
  let requirements: string[] = [];
  if (reqParams.length > 0) requirements = reqParams;
  else if (reqCsv)
    requirements = reqCsv
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
  const questions = await generateOnboardingQuestions(industry, requirements);
  return json(
    { industry, count: questions.length, questions, requestId, actor },
    cors,
  );
}
function isStatus(url: URL, req: Request) {
  return url.pathname.startsWith("/api/onboarding/") && req.method === "GET";
}
async function handleStatus(
  url: URL,
  env: Env,
  cors: Record<string, string>,
  requestId: string,
  actor?: string,
) {
  const tenantId = url.pathname.split("/").pop();
  if (!tenantId)
    return json(
      { ...OnboardingErrors.TENANT_ID_REQUIRED(), requestId, actor },
      cors,
      400,
    );

  const session = await getSessionByTenant(env.DB, tenantId);
  if (!session)
    return json(
      { ...OnboardingErrors.ONBOARDING_NOT_FOUND(), requestId, actor },
      cors,
      404,
    );

  const payload = JSON.stringify({
    sessionId: session.id,
    status: session.status,
    industry: session.industry,
    config: session.generated_config,
    started_at: session.started_at,
    completed_at: session.completed_at,
    updated_at: session.updated_at,
    requestId,
    actor,
  });

  const resp = new Response(payload, {
    headers: { "Content-Type": "application/json", ...cors },
  });
  resp.headers.set("x-request-id", requestId);
  if (actor) resp.headers.set("x-actor", actor);
  return resp;
}

function notFound(
  url: URL,
  method: string,
  corsHeaders: Record<string, string>,
  requestId: string,
  actor?: string,
) {
  return json(
    { error: "Not Found", path: url.pathname, method, requestId, actor },
    corsHeaders,
    404,
  );
}

function json(obj: any, corsHeaders: Record<string, string>, status = 200) {
  const payload = { ...obj };
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
