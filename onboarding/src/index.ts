import {
  handleOnboarding,
  generateOnboardingQuestions,
} from "./handlers/onboarding";
import { Env } from "./types";
import { handleError } from "./utils/error";
import { logger, validateEnv, commonEnvSpec } from "@atlasit/shared";
import { OnboardingErrors } from "./utils/errors";

// NOTE: Env validation integration deferred to Phase 1 (tracked in sprint backlog)

let envValidated = false;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders();
    if (request.method === "OPTIONS")
      return new Response(null, { headers: corsHeaders });

    if (!envValidated) {
      try {
        validateEnv(commonEnvSpec as any, env as any);
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
  } as const;
}

async function routeRequest(
  request: Request,
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  if (url.pathname === "/health") return handleHealth(corsHeaders);
  if (isStart(url, request)) return handleStart(request, corsHeaders);
  if (isSubmit(url, request)) return handleSubmit(request, env, corsHeaders);
  if (isQuestions(url, request)) return handleQuestions(url, corsHeaders);
  if (isStatus(url, request)) return handleStatus(url, env, corsHeaders);
  return null;
}

function handleHealth(cors: Record<string, string>) {
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
function isStart(url: URL, req: Request) {
  return url.pathname === "/onboarding/start" && req.method === "POST";
}
async function handleStart(request: Request, cors: Record<string, string>) {
  interface StartBody {
    industry?: string;
    requirements?: string[];
  }
  const body = (await request.json().catch(() => ({}))) as StartBody;
  const questions = await generateOnboardingQuestions(
    body.industry || "general",
    body.requirements || [],
  );
  return json({ questions, version: "1.0.0" }, cors);
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
) {
  const response = await handleOnboarding(request, env);
  Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
function isQuestions(url: URL, req: Request) {
  return url.pathname === "/api/onboarding/questions" && req.method === "GET";
}
async function handleQuestions(url: URL, cors: Record<string, string>) {
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
  return json({ industry, count: questions.length, questions }, cors);
}
function isStatus(url: URL, req: Request) {
  return url.pathname.startsWith("/api/onboarding/") && req.method === "GET";
}
async function handleStatus(url: URL, env: Env, cors: Record<string, string>) {
  const tenantId = url.pathname.split("/").pop();
  if (!tenantId) return json(OnboardingErrors.TENANT_ID_REQUIRED(), cors, 400);
  const state = await env.STATE.get(`onboarding:${tenantId}`);
  if (!state) return json(OnboardingErrors.ONBOARDING_NOT_FOUND(), cors, 404);
  return new Response(state, {
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function notFound(
  url: URL,
  method: string,
  corsHeaders: Record<string, string>,
) {
  return json(
    { error: "Not Found", path: url.pathname, method },
    corsHeaders,
    404,
  );
}

function json(obj: any, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
