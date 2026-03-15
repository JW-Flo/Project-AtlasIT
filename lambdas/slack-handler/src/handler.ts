import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { route } from "./routes.js";

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    return await route(event);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    const status = (err as { status?: number }).status ?? 500;
    return {
      statusCode: status,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: message }),
    };
  }
}
