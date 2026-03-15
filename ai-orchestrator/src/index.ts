import { Hono } from "hono";
import { cors } from "hono/cors";
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

// Auth middleware on API routes (health stays public)
app.use("/api/*", async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  const allowedKeys = (c.env.API_ALLOWED_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (allowedKeys.length > 0) {
    if (!apiKey || !allowedKeys.includes(apiKey)) {
      return c.json(
        {
          status: "error",
          code: "UNAUTHORIZED",
          message: "Missing or invalid API key",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        401,
      );
    }
    c.set("tenantId", c.req.header("X-Tenant-ID") ?? "default");
  }
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
export default app;
