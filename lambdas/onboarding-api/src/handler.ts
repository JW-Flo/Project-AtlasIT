import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { route } from "./routes.js";

// NOTE: routes in routes.ts expect the full `/api/onboarding/*` path (unlike
// compliance-api which strips the prefix). Don't mangle rawPath here — route()
// matches exact paths. /health is served separately by checking the last
// segment (set by API Gateway proxy mapping).

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    return await route(event);
  } catch (err) {
    console.error("[onboarding-api] Unhandled error", {
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
