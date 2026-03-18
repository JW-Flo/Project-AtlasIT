import { json } from "@sveltejs/kit";

/**
 * Returns a structured JSON error response for BFF API routes.
 * All error responses from +server.ts files should go through this helper
 * so the UI always receives `{ error: string, code?: string }` — never raw
 * HTML, stack traces, or unstructured text.
 */
export function errorResponse(
  message: string,
  status: number,
  code?: string,
): Response {
  return json({ error: message, ...(code ? { code } : {}) }, { status });
}
