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

  // TODO: Wire up GitHub API proxy with SSM-stored credentials

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "github-proxy" });
  }

  // ANY /api/v1/github/{proxy+}

  return json(404, { error: "Not found" });
}
