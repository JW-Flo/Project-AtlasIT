export const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function buildCors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS,HEAD",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Request-ID, X-Signature, X-Correlation-ID",
  };
}

export function mergeHeaders(
  base: Record<string, string>,
  additions: Record<string, string>,
): Record<string, string> {
  return { ...base, ...additions };
}

export function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: mergeHeaders(headers, { "content-type": "application/json" }),
  });
}

export function errorResponse(
  status: number,
  requestId: string,
  headers: Record<string, string>,
  message: string,
): Response {
  return jsonResponse({ error: message, requestId }, status, headers);
}
