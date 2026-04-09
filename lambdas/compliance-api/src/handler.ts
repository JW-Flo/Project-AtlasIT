import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { route } from "./routes.js";

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
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
