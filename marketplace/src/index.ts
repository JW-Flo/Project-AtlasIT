import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";
import { healthRoute } from "./routes/health";
import { appRoutes } from "./routes/apps";
import { installRoutes } from "./routes/installs";

export type { Bindings, Variables, AppEnv } from "./types";

const app = new Hono<AppEnv>();

// Global middleware
app.use("*", cors());

// Correlation ID middleware
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

// Error handler middleware
app.onError((err, c) => {
  const correlationId = c.get("correlationId") ?? crypto.randomUUID();

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";

  if (err.name === "NotFoundError") {
    status = 404;
    code = "NOT_FOUND";
    message = err.message;
  } else if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_FAILED";
    message = err.message;
  }

  console.error(
    JSON.stringify({
      level: "error",
      correlationId,
      code,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    }),
  );

  return c.json(
    {
      status: "error" as const,
      code,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    status as any,
  );
});

// Routes
app.route("/", healthRoute);
app.route("/api/v1/apps", appRoutes);
app.route("/api/v1/installs", installRoutes);

export default app;
