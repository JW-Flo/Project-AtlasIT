import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";
import { healthRoute } from "./routes/health";
import { appRoutes } from "./routes/apps";
import { installRoutes } from "./routes/installs";

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
  const allowedKeys = ((c.env as Record<string, string>).API_ALLOWED_KEYS ?? "")
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
  } else {
    // Fail-closed: no API keys configured means reject in production.
    const environment = ((c.env as Record<string, string>).ENVIRONMENT ?? "").toLowerCase();
    if (environment !== "development") {
      return c.json(
        {
          status: "error",
          code: "AUTH_NOT_CONFIGURED",
          message: "API authentication is not configured. Set API_ALLOWED_KEYS.",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        401,
      );
    }
  }
  await next();
});

// Error handler middleware
app.onError((err, c) => {
  const correlationId = c.get("correlationId") ?? crypto.randomUUID();

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";

  if (err.name === "AuthError" && "status" in err) {
    status = (err as any).status;
    code = status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
    message = err.message;
  } else if (err.name === "NotFoundError") {
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
