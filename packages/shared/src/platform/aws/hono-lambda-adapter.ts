/**
 * Hono → AWS Lambda adapter
 *
 * Wraps a Hono app so it can run as an AWS Lambda handler
 * without rewriting the existing CF Worker routes.
 *
 * Usage in each adapter:
 *   import { createLambdaHandler } from '@atlasit/shared/platform/aws/hono-lambda-adapter.js';
 *   import app from './index.js';
 *   export const handler = createLambdaHandler(app);
 */

import type { Hono } from "hono";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export function createLambdaHandler(app: Hono) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const qs = event.queryStringParameters ?? {};
    const queryString = Object.entries(qs)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? "")}`)
      .join("&");
    const url = `https://localhost${path}${queryString ? "?" + queryString : ""}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(event.headers ?? {})) {
      if (value) headers.set(key, value);
    }

    const body =
      method !== "GET" && method !== "HEAD" && event.body
        ? event.isBase64Encoded
          ? Buffer.from(event.body, "base64")
          : event.body
        : undefined;

    const request = new Request(url, { method, headers, body });
    const response = await app.fetch(request);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });

    const responseBody = await response.text();

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  };
}
