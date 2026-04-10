import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { route } from "./routes.js";

// API Gateway routes to /api/compliance/{proxy+} — strip prefix so Lambda routes match
const PATH_PREFIX = "/api/compliance";

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    if (event.rawPath.startsWith(PATH_PREFIX)) {
      event.rawPath = event.rawPath.slice(PATH_PREFIX.length) || "/";
      event.requestContext.http.path = event.rawPath;
    }
    return await route(event);
  } catch (err) {
    console.error("[compliance-api] Unhandled error", {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "error", message: "Internal server error" }),
    };
  }
}
