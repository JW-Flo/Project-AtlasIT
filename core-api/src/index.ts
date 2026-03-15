import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";
import { healthRoute } from "./routes/health";
import { tenantRoutes } from "./routes/tenants";
import { eventRoutes } from "./routes/events";
import { authRoutes } from "./routes/auth";
import { flagRoutes } from "./routes/flags";
import { credentialRoutes } from "./routes/credentials";

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

  if (
    err.message === "Missing or invalid authentication" ||
    err.message === "Not authenticated"
  ) {
    status = 401;
    code = "UNAUTHORIZED";
    message = err.message;
  } else if (err.message.startsWith("Missing required role")) {
    status = 403;
    code = "FORBIDDEN";
    message = err.message;
  } else if (err.name === "NotFoundError") {
    status = 404;
    code = "NOT_FOUND";
    message = err.message;
  } else if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_FAILED";
    message = err.message;
  } else if (err.name === "AuthError" && "status" in err) {
    status = (err as any).status;
    code = status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
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
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/tenants", tenantRoutes);
app.route("/api/v1/events", eventRoutes);
app.route("/api/v1/flags", flagRoutes);
app.route("/api/v1/credentials", credentialRoutes);

export default app;
