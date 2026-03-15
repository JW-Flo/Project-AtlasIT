import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const json = (status: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export async function route(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const { routeKey, rawPath } = event;

  // TODO: Wire up repository and service layer

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "core-api" });
  }

  // GET /api/v1/core/activity

  return json(404, { error: "Not found" });
}
