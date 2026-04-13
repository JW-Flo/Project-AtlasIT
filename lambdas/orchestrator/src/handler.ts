import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  SQSEvent,
  SQSBatchResponse,
} from "aws-lambda";
import { route } from "./routes.js";
import { processSqsBatch } from "./processor.js";

type SchedulerEvent = { source?: string; action?: string };
type LambdaEvent = APIGatewayProxyEventV2 | SQSEvent | SchedulerEvent;

// API Gateway routes to /orchestrator/{proxy+} — strip prefix so Lambda routes match
const PATH_PREFIX = "/orchestrator";

export async function handler(
  event: LambdaEvent,
): Promise<APIGatewayProxyResultV2 | SQSBatchResponse | void> {
  try {
    // SQS batch events have a Records array with eventSource = "aws:sqs"
    if (
      "Records" in event &&
      Array.isArray(event.Records) &&
      event.Records[0]?.eventSource === "aws:sqs"
    ) {
      return await processSqsBatch(event as SQSEvent);
    }

    // EventBridge Scheduler invocations deliver {source, action} with no rawPath.
    // Current scheduled actions: "dispatch-tasks". Treat as heartbeat — the
    // actual task processing runs via SQS consumers + cron jobs on the scheduler
    // Lambda, so this is a log-and-ack. Extend this when we have real cron
    // work for orchestrator.
    const apiEvent = event as APIGatewayProxyEventV2;
    if (!apiEvent.rawPath && (event as SchedulerEvent).source === "scheduler") {
      const action = (event as SchedulerEvent).action ?? "";
      console.log("[orchestrator] scheduler.tick", { action, ts: new Date().toISOString() });
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, action }),
      };
    }

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
