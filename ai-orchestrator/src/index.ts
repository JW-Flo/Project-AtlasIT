import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";
import { eventRoutes } from "./routes/events";
import { agentRoutes } from "./routes/agents";
import { healthRoute } from "./routes/health";
import { workflowRoutes } from "./routes/workflows";
import { deadLetterRoutes } from "./routes/dead-letter";

const app = new Hono<AppEnv>();

app.use("*", cors());

// Correlation ID
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

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
  return c.json(
    {
      status: "error",
      code: "INTERNAL_ERROR",
      message: err.message,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    500,
  );
});

app.route("/", healthRoute);
app.route("/api/v1/events", eventRoutes);
app.route("/api/v1/agents", agentRoutes);
app.route("/api/v1/workflows", workflowRoutes);
app.route("/api/v1/dead-letter", deadLetterRoutes);

export { WorkflowDO } from "./workflow/workflow-do";
export default app;
