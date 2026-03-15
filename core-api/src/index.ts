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

// Correlation ID middleware
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
