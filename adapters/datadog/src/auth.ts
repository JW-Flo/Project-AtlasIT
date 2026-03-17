import type { Context, Next } from "hono";

const HEADER_NAME = "DD-API-KEY";
const HEADER_PREFIX = undefined;

export async function authMiddleware(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  await next();
}

export function injectApiKeyHeaders(
  env: Record<string, string>,
): Record<string, string> {
  const apiKey = env.DATADOG_API_KEY;
  const appKey = env.DATADOG_APP_KEY;
  if (!apiKey) {
    throw new Error("API key not configured: DATADOG_API_KEY");
  }
  if (!appKey) {
    throw new Error("App key not configured: DATADOG_APP_KEY");
  }

  return {
    "DD-API-KEY": apiKey,
    "DD-APPLICATION-KEY": appKey,
  };
}

export function createAuthenticatedFetch(
  env: Record<string, string>,
): typeof fetch {
  const headers = injectApiKeyHeaders(env);
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const mergedInit = {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers ?? {}),
      },
    };
    return fetch(input, mergedInit);
  };
}
