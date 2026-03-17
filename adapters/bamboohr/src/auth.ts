import type { Context, Next } from "hono";

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

/**
 * BambooHR uses API Key authentication (Basic Auth).
 * No OAuth flow needed — apiKey is stored in connector_configs and used
 * for direct API calls.
 */
export function validateApiKey(apiKey: string): boolean {
  return !!apiKey && apiKey.length > 10;
}
