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

  // TODO: Wire up Slack webhook verification and command handling

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "slack-handler" });
  }

  // POST /api/v1/slack/events
  // POST /api/v1/slack/commands
  // POST /api/v1/slack/interactions

  return json(404, { error: "Not found" });
}
