import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

// Simple in-memory rate limiter (per tenant)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // 10 errors per minute per tenant
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * POST /api/errors
 * Log client-side errors to CloudWatch (via console.error).
 * This is a fire-and-forget endpoint that should never fail visibly to the client.
 *
 * Security: Requires authentication, rate limited, sanitizes sensitive data
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user as any;

  // Silent fail for unauthenticated requests (don't expose endpoint existence)
  if (!user) {
    return json({ ok: true });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ ok: true });
  }

  // Rate limit: 10 errors per minute per tenant
  const rateLimitKey = `error-log:tenant:${tenantId}`;
  if (!checkRateLimit(rateLimitKey)) {
    return json({ ok: true }); // Silent fail on rate limit
  }

  try {
    // Max body size check (10KB)
    const contentLength = parseInt(request.headers.get("content-length") || "0");
    if (contentLength > 10240) {
      return json({ ok: true }, { status: 413 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return json({ ok: true });
    }

    // Sanitize metadata - remove stack traces and sensitive fields
    const sanitizedMetadata = { ...body.metadata };
    delete sanitizedMetadata.componentStack;
    delete sanitizedMetadata.stack;
    delete sanitizedMetadata.error;

    // Sanitize URL - path only, no query params
    let sanitizedUrl: string | undefined;
    if (body.url) {
      try {
        const url = new URL(body.url);
        sanitizedUrl = url.pathname;
      } catch {
        sanitizedUrl = undefined;
      }
    }

    const logEntry = {
      level: "error",
      source: "client",
      tenantId,
      userId: user.id,
      type: body.type || "unknown",
      message: body.message || "Unknown error",
      httpStatus: body.httpStatus,
      url: sanitizedUrl,
      timestamp: body.timestamp || new Date().toISOString(),
      metadata: sanitizedMetadata,
    };

    console.error(JSON.stringify(logEntry));

    return json({ ok: true });
  } catch (error) {
    // Silent fail - logging errors should not interrupt the user experience
    return json({ ok: true });
  }
};
