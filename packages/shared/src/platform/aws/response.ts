/**
 * Standardized Lambda response helpers.
 * Ensures consistent JSON shape across all Lambda handlers:
 *   { status, code?, data?, message?, timestamp, requestId? }
 */

import type { APIGatewayProxyResultV2 } from "aws-lambda";

const JSON_HEADERS: Record<string, string> = {
  "content-type": "application/json",
  "x-content-type-options": "nosniff",
};

export function ok(
  data: unknown,
  statusCode = 200,
  requestId?: string,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify({
      status: "success",
      data,
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    }),
  };
}

export function fail(
  statusCode: number,
  message: string,
  code: string,
  requestId?: string,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify({
      status: "error",
      code,
      message,
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    }),
  };
}

export function parseBody(body?: string, isBase64?: boolean): Record<string, unknown> {
  if (!body) return {};
  try {
    const raw = isBase64 ? Buffer.from(body, "base64").toString() : body;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
