import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  SQSEvent,
  SQSBatchResponse,
} from "aws-lambda";
import { route } from "./routes.js";
import { processSqsBatch } from "./processor.js";

type LambdaEvent = APIGatewayProxyEventV2 | SQSEvent;

// API Gateway routes to /orchestrator/{proxy+} — strip prefix so Lambda routes match
const PATH_PREFIX = "/orchestrator";

export async function handler(
  event: LambdaEvent,
): Promise<APIGatewayProxyResultV2 | SQSBatchResponse | void> {
  try {
    // SQS batch events have a Records array with eventSource = "aws:sqs"
    if ("Records" in event && Array.isArray(event.Records) && event.Records[0]?.eventSource === "aws:sqs") {
      return await processSqsBatch(event as SQSEvent);
    }
    const apiEvent = event as APIGatewayProxyEventV2;
    if (apiEvent.rawPath.startsWith(PATH_PREFIX)) {
      apiEvent.rawPath = apiEvent.rawPath.slice(PATH_PREFIX.length) || "/";
      apiEvent.requestContext.http.path = apiEvent.rawPath;
    }
    return await route(apiEvent);
  } catch (err) {
    console.error("[orchestrator] Unhandled error", {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    if ("Records" in event) {
      // For SQS events, re-throw so the batch is retried
      throw err;
    }
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "error", message: "Internal server error" }),
    };
  }
}
