import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  SQSEvent,
  SQSBatchResponse,
} from "aws-lambda";
import { route } from "./routes.js";
import { processSqsBatch } from "./processor.js";

type LambdaEvent = APIGatewayProxyEventV2 | SQSEvent;

export async function handler(
  event: LambdaEvent,
): Promise<APIGatewayProxyResultV2 | SQSBatchResponse | void> {
  try {
    // SQS batch events have a Records array with eventSource = "aws:sqs"
    if ("Records" in event && Array.isArray(event.Records) && event.Records[0]?.eventSource === "aws:sqs") {
      return await processSqsBatch(event as SQSEvent);
    }
    return await route(event as APIGatewayProxyEventV2);
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
