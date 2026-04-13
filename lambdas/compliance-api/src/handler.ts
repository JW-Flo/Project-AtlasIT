import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { route } from "./routes.js";

// API Gateway routes to /api/compliance/{proxy+} — strip prefix so Lambda routes match
const PATH_PREFIX = "/api/compliance";

// EventBridge Scheduler invocations (aws_scheduler_schedule) deliver events of
// shape {source: "scheduler", action: "<name>"} — no rawPath. Map to internal
// Lambda routes.
const SCHEDULER_ACTION_PATH: Record<string, string> = {
  "compliance-scoring": "/internal/compliance-packs/evaluate-all",
  "daily-full-evaluation": "/internal/compliance-packs/evaluate-all",
};

type SchedulerEvent = { source?: string; action?: string };
type AnyEvent = APIGatewayProxyEventV2 | SchedulerEvent;

export async function handler(event: AnyEvent): Promise<APIGatewayProxyResultV2> {
  try {
    // Scheduler-invoked cron — synthesize an API Gateway event shape so route() works.
    const apiEvent = event as APIGatewayProxyEventV2;
    if (!apiEvent.rawPath && (event as SchedulerEvent).source === "scheduler") {
      const action = (event as SchedulerEvent).action ?? "";
      const path = SCHEDULER_ACTION_PATH[action];
      if (!path) {
        console.log("[compliance-api] scheduler.unknown_action", { action });
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skipped: action }),
        };
      }
      const synthesized: APIGatewayProxyEventV2 = {
        version: "2.0",
        routeKey: `POST ${path}`,
        rawPath: path,
        rawQueryString: "",
        headers: {
          "content-type": "application/json",
          "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
        },
        requestContext: {
          accountId: "scheduler",
          apiId: "scheduler",
          domainName: "scheduler.internal",
          domainPrefix: "scheduler",
          http: {
            method: "POST",
            path,
            protocol: "HTTP/1.1",
            sourceIp: "127.0.0.1",
            userAgent: "EventBridgeScheduler",
          },
          requestId: `scheduler-${Date.now()}`,
          routeKey: `POST ${path}`,
          stage: "$default",
          time: new Date().toISOString(),
          timeEpoch: Date.now(),
        },
        body: "{}",
        isBase64Encoded: false,
      };
      return await route(synthesized);
    }

    // Regular API Gateway invocation
    if (apiEvent.rawPath.startsWith(PATH_PREFIX)) {
      apiEvent.rawPath = apiEvent.rawPath.slice(PATH_PREFIX.length) || "/";
      apiEvent.requestContext.http.path = apiEvent.rawPath;
    }
    return await route(apiEvent);
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
