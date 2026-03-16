import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware as sharedAuthMiddleware } from "@atlasit/shared";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "./types";
import { eventRoutes } from "./routes/events";
import { agentRoutes } from "./routes/agents";
import { healthRoute } from "./routes/health";
import { workflowRoutes } from "./routes/workflows";
import { deadLetterRoutes } from "./routes/dead-letter";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: ["https://console.atlasit.pro", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-Tenant-ID",
      "X-Correlation-ID",
    ],
  }),
);

// Correlation ID
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

// Auth middleware on API routes (health stays public).
// Thin wrapper: delegates to shared authMiddleware when API keys are configured,
// sets tenantId from header when no keys are configured (dev/unconfigured).
const apiAuth: MiddlewareHandler = async (c, next) => {
  const allowedKeys = ((c.env as Record<string, string>).API_ALLOWED_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (
    allowedKeys.length > 0 ||
    c.req.header("Authorization")?.startsWith("Bearer ")
  ) {
    return sharedAuthMiddleware({ allowApiKey: true })(c, next);
  }
  // No API keys configured and no Bearer token — pass through with default tenant
  c.set("tenantId", c.req.header("X-Tenant-ID") ?? "default");
  await next();
};
app.use("/api/*", apiAuth);

// Error handler
app.onError((err, c) => {
  const correlationId = c.get("correlationId") ?? crypto.randomUUID();
  console.error(
    JSON.stringify({
      level: "error",
      correlationId,
      message: err.message,
      stack: err.stack,
    }),
  );
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = err.message;

  if (err.name === "AuthError" && "status" in err) {
    status = (err as any).status;
    code = status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
    message = err.message;
  }

  return c.json(
    {
      status: "error",
      code,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    status as any,
  );
});

app.route("/", healthRoute);
app.route("/api/v1/events", eventRoutes);
app.route("/api/v1/agents", agentRoutes);
app.route("/api/v1/workflows", workflowRoutes);
app.route("/api/v1/dead-letter", deadLetterRoutes);

export { WorkflowDO } from "./workflow/workflow-do";
export { app };

// ---------------------------------------------------------------------------
// Queue consumer handler for step-result messages
// ---------------------------------------------------------------------------

interface StepResultMessage {
  kind: "step-result";
  runId: string;
  stepId: string;
  attempt: number;
  success: boolean;
  output?: unknown;
  error?: string;
}

interface QueueMessage<T = unknown> {
  body: T;
  ack(): void;
  retry(): void;
}

interface QueueBatch<T = unknown> {
  messages: QueueMessage<T>[];
}

const worker = {
  fetch: app.fetch,
  async queue(
    batch: QueueBatch<StepResultMessage>,
    env: { WORKFLOW: DurableObjectNamespace },
  ): Promise<void> {
    for (const message of batch.messages) {
      const msg = message.body;
      if (msg.kind !== "step-result") {
        message.ack();
        continue;
      }

      try {
        const doId = env.WORKFLOW.idFromName(msg.runId);
        const stub = env.WORKFLOW.get(doId);

        const endpoint = msg.success
          ? `http://workflow/step/${msg.stepId}/complete`
          : `http://workflow/step/${msg.stepId}/fail`;

        const body = msg.success
          ? JSON.stringify({ output: msg.output })
          : JSON.stringify({ error: msg.error ?? "Unknown error" });

        const response = await stub.fetch(
          new Request(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }),
        );

        if (response.ok || response.status === 409) {
          message.ack();
        } else {
          message.retry();
        }
      } catch {
        message.retry();
      }
    }
  },
};

export default worker;
