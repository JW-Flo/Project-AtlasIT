import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import app from "./index.js";

const PATH_PREFIX = "/adapters/microsoft-365";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  let path = event.rawPath;
  // Strip API Gateway path prefix so Hono routes match
  if (path.startsWith(PATH_PREFIX)) path = path.slice(PATH_PREFIX.length) || "/";
  const qs = event.queryStringParameters ?? {};
  const queryString = Object.entries(qs)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? "")}`)
    .join("&");
  const url = `https://localhost${path}${queryString ? "?" + queryString : ""}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (value) headers.set(key, value);
  }
  const body = method !== "GET" && method !== "HEAD" && event.body
    ? event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body
    : undefined;
  const request = new Request(url, { method, headers, body });
  const response = await app.fetch(request);
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((v, k) => { responseHeaders[k] = v; });
  return { statusCode: response.status, headers: responseHeaders, body: await response.text() };
};
