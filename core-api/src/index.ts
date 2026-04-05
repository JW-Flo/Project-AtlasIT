import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware as sharedAuthMiddleware } from "@atlasit/shared";
import type { MiddlewareHandler } from "hono";
import type { AppEnv, Bindings } from "./types";
import { healthRoute } from "./routes/health";
import { tenantRoutes } from "./routes/tenants";
import { eventRoutes } from "./routes/events";
import { authRoutes } from "./routes/auth";
import { flagRoutes } from "./routes/flags";
import { credentialRoutes } from "./routes/credentials";

export type { Bindings, Variables, AppEnv } from "./types";

/**
 * Fail fast at request time if required bindings are absent.
 * This surfaces misconfigured deployments immediately rather than producing
 * opaque 500s deep inside a handler.
 */
function validateEnv(env: Bindings): void {
  const required: [keyof Bindings, string][] = [
    ["DB", "D1 database binding"],
    ["CRED_ENCRYPTION_KEY", "credential encryption key"],
    ["KV_SESSIONS", "KV sessions namespace"],
  ];
  const missing = required.filter(([key]) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required bindings: ${missing.map(([k, d]) => `${k} (${d})`).join(", ")}`,
    );
  }
}

const app = new Hono<AppEnv>();

// Global middleware
app.use(
  "*",
  cors({
    origin: ["https://console.atlasit.pro", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Tenant-ID", "X-Correlation-ID"],
  }),
);

// Correlation ID middleware
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
  const envRecord = c.env as Record<string, string>;
  const allowedKeys = (envRecord.API_ALLOWED_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (allowedKeys.length > 0 || c.req.header("Authorization")?.startsWith("Bearer ")) {
    return sharedAuthMiddleware({ allowApiKey: true })(c, next);
  }

  // Fail-closed: no API keys configured means reject in production.
  // Only allow dev bypass when ENVIRONMENT is explicitly "development".
  const environment = (envRecord.ENVIRONMENT ?? "").toLowerCase();
  if (environment === "development") {
    const tenantId = c.req.header("X-Tenant-ID") ?? "default";
    c.set("tenantId", tenantId);
    c.set("auth", {
      tenantId,
      userId: "",
      email: "",
      roles: ["admin"],
      tokenType: "api-key" as const,
    });
    return next();
  }

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
};
app.use("/api/*", apiAuth);

// Error handler middleware
app.onError((err, c) => {
  const correlationId = c.get("correlationId") ?? crypto.randomUUID();

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";

  if (err.message === "Missing or invalid authentication" || err.message === "Not authenticated") {
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

export { app };

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext): Response | Promise<Response> {
    // Skip binding validation for health endpoint so it's always accessible
    const url = new URL(request.url);
    if (url.pathname !== "/health") {
      validateEnv(env);
    }
    return app.fetch(request, env, ctx);
  },
};
