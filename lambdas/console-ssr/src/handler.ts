import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

// The SvelteKit Node adapter produces a handler at build time.
// This Lambda wrapper translates between API Gateway v2 events
// and the Node HTTP server that SvelteKit expects.

let svelteHandler: ((req: Request) => Promise<Response>) | null = null;

async function loadHandler() {
  if (svelteHandler) return svelteHandler;
  // SvelteKit build output is copied into the Lambda deployment package
  // The adapter-node build produces a server that exposes a `handler` function
  const mod = await import("./server/index.js");
  svelteHandler = mod.handler;
  return svelteHandler;
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const handle = await loadHandler();

  const url = `https://${event.requestContext.domainName}${event.rawPath}${event.rawQueryString ? `?${event.rawQueryString}` : ""}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers)) {
    if (value) headers.set(key, value);
  }

  const request = new Request(url, {
    method: event.requestContext.http.method,
    headers,
    body: event.body
      ? event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : event.body
      : undefined,
  });

  try {
    const response = await handle(request);
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body,
      isBase64Encoded: false,
    };
  } catch (err) {
    console.error("SSR error:", err);
    return {
      statusCode: 500,
      headers: { "content-type": "text/html" },
      body: "<h1>Internal Server Error</h1>",
    };
  }
}
