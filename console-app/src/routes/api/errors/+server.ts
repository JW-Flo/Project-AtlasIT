import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

/**
 * POST /api/errors
 * Log client-side errors to CloudWatch (via console.error for now).
 * This is a fire-and-forget endpoint that should never fail visibly to the client.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    // Structure the log for CloudWatch consumption
    const logEntry = {
      level: "error",
      source: "client",
      type: body.type || "unknown",
      message: body.message || "Unknown error",
      httpStatus: body.httpStatus,
      timestamp: body.timestamp || new Date().toISOString(),
      userAgent: body.userAgent,
      url: body.url,
      metadata: body.metadata || {},
    };

    // Log to console (CloudWatch captures stdout)
    console.error(JSON.stringify(logEntry));

    // Always return success - we don't want to fail the client on logging errors
    return json({ ok: true });
  } catch (error) {
    // Even if logging fails, return 200 to avoid blocking the client
    console.error(
      JSON.stringify({
        level: "error",
        message: "Error logging endpoint failed",
        error: String(error),
      }),
    );
    return json({ ok: true });
  }
};
