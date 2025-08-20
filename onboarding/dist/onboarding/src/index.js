import {
  handleOnboarding,
  generateOnboardingQuestions,
} from "./handlers/onboarding";
import { handleError } from "./utils/error";
import { logger, validateEnv, commonEnvSpec } from "@atlasit/shared";
import { OnboardingErrors } from "./utils/errors";
// NOTE: Env validation integration deferred to Phase 1 (tracked in sprint backlog)
let envValidated = false;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders();
    if (request.method === "OPTIONS")
      return new Response(null, { headers: corsHeaders });
    if (!envValidated) {
      try {
        validateEnv(commonEnvSpec, env);
      } catch (e) {
        if (logger && typeof logger.warn === "function")
          logger.warn("Env validation warning (non-fatal)", {
            error: String(e),
          });
      } finally {
        envValidated = true; // Avoid repeated validation
      }
    }
    try {
      const routeResponse = await routeRequest(request, url, env, corsHeaders);
      if (routeResponse) return routeResponse;
      return notFound(url, request.method, corsHeaders);
    } catch (error) {
      console.error("Unhandled error:", error);
      return handleError(error);
    }
  },
};
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
async function routeRequest(request, url, env, corsHeaders) {
  if (url.pathname === "/health") return handleHealth(corsHeaders);
  if (isStart(url, request)) return handleStart(request, corsHeaders);
  if (isSubmit(url, request)) return handleSubmit(request, env, corsHeaders);
  if (isQuestions(url, request)) return handleQuestions(url, corsHeaders);
  if (isStatus(url, request)) return handleStatus(url, env, corsHeaders);
  return null;
}
function handleHealth(cors) {
  logger.info("Health check");
  return json(
    {
      status: "healthy",
      service: "onboarding",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
    cors,
  );
}
function isStart(url, req) {
  return url.pathname === "/onboarding/start" && req.method === "POST";
}
async function handleStart(request, cors) {
  const body = await request.json().catch(() => ({}));
  const questions = await generateOnboardingQuestions(
    body.industry || "general",
    body.requirements || [],
  );
  return json({ questions, version: "1.0.0" }, cors);
}
function isSubmit(url, req) {
  return (
    (url.pathname === "/onboarding/submit" ||
      url.pathname === "/api/onboarding") &&
    req.method === "POST"
  );
}
async function handleSubmit(request, env, cors) {
  const response = await handleOnboarding(request, env);
  Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
function isQuestions(url, req) {
  return url.pathname === "/api/onboarding/questions" && req.method === "GET";
}
async function handleQuestions(url, cors) {
  const industry = url.searchParams.get("industry") || "technology";
  const reqParams = url.searchParams.getAll("req");
  const reqCsv = url.searchParams.get("requirements");
  let requirements = [];
  if (reqParams.length > 0) requirements = reqParams;
  else if (reqCsv)
    requirements = reqCsv
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
  const questions = await generateOnboardingQuestions(industry, requirements);
  return json({ industry, count: questions.length, questions }, cors);
}
function isStatus(url, req) {
  return url.pathname.startsWith("/api/onboarding/") && req.method === "GET";
}
async function handleStatus(url, env, cors) {
  const tenantId = url.pathname.split("/").pop();
  if (!tenantId) return json(OnboardingErrors.TENANT_ID_REQUIRED(), cors, 400);
  const state = await env.STATE.get(`onboarding:${tenantId}`);
  if (!state) return json(OnboardingErrors.ONBOARDING_NOT_FOUND(), cors, 404);
  return new Response(state, {
    headers: { "Content-Type": "application/json", ...cors },
  });
}
function notFound(url, method, corsHeaders) {
  return json(
    { error: "Not Found", path: url.pathname, method },
    corsHeaders,
    404,
  );
}
function json(obj, corsHeaders, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
//# sourceMappingURL=index.js.map
