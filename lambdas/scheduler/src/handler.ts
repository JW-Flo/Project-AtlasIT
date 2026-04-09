import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  ScheduledEvent,
} from "aws-lambda";
import { route } from "./routes.js";
import { runScheduledJobs } from "./jobs.js";

type LambdaEvent = APIGatewayProxyEventV2 | ScheduledEvent;

export async function handler(
  event: LambdaEvent,
): Promise<APIGatewayProxyResultV2 | void> {
  try {
    // EventBridge scheduled events have a "source" field of "aws.events"
    if ("source" in event && event.source === "aws.events") {
      return await runScheduledJobs(event as ScheduledEvent);
    }
    return await route(event as APIGatewayProxyEventV2);
  } catch (err) {
    console.error("[scheduler] Unhandled error", {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    if ("source" in event) {
      throw err; // Re-throw scheduled events for EventBridge retry
    }
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "error", message: "Internal server error" }),
    };
  }
}
