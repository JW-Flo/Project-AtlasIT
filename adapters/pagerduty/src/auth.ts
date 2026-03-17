import type { Context, Next } from "hono";

const HEADER_NAME = "Authorization";
const HEADER_PREFIX = "Token token=";

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
  const apiKey = env.PAGERDUTY_API_KEY;
  if (!apiKey) {
    throw new Error("API key not configured: PAGERDUTY_API_KEY");
  }

  return {
    Authorization: `Token token=${apiKey}`,
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
