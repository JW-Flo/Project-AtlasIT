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

export function loadServiceAccountCredentials(
  env: Record<string, string>,
): Record<string, string> {
  const credentialsJson = env.SERVICE_ACCOUNT_CREDENTIALS;
  if (!credentialsJson) {
    throw new Error("SERVICE_ACCOUNT_CREDENTIALS not configured");
  }

  try {
    return JSON.parse(credentialsJson) as Record<string, string>;
  } catch {
    throw new Error("SERVICE_ACCOUNT_CREDENTIALS contains invalid JSON");
  }
}
