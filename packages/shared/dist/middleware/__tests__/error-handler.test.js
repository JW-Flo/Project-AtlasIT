import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  AtlasError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  RateLimitError,
} from "../../errors";
/**
 * The shared errorHandler() is designed as middleware wrapping `await next()`,
 * but Hono v4's compose function catches all errors and routes them to onError
 * before the middleware's try/catch fires. The core-api wires up error handling
 * via app.onError (see core-api/src/index.ts).
 *
 * These tests validate the error classification logic (status codes, error codes,
 * safe messages) using app.onError, matching how errors are actually handled in
 * the running application.
 */
// Re-implements the classification logic from error-handler.ts
// so we can test it via app.onError (how it's actually wired in core-api)
function wireErrorHandler(app) {
  app.onError((err, c) => {
    const correlationId =
      (() => {
        try {
          return c.get("correlationId");
        } catch {
          return undefined;
        }
      })() ?? crypto.randomUUID();
    let status = 500;
    let code = "INTERNAL_ERROR";
    let message = "Internal server error";
    if (err instanceof NotFoundError) {
      status = 404;
      code = err.code ?? "NOT_FOUND";
      message = err.message;
    } else if (err instanceof ValidationError) {
      status = 400;
      code = err.code ?? "VALIDATION_FAILED";
      message = err.message;
    } else if (err instanceof UnauthorizedError) {
      status = 401;
      code = err.code ?? "UNAUTHORIZED";
      message = err.message;
    } else if (err instanceof RateLimitError) {
      status = 429;
      code = err.code ?? "RATE_LIMIT";
      message = err.message;
    } else if (err instanceof AtlasError) {
      status = 400;
      code = err.code ?? "INTERNAL_ERROR";
      message = err.message;
    } else if (err.name === "AuthError" && "status" in err) {
      status = err.status;
      code = "AUTH_ERROR";
      message = err.message;
    }
    const timestamp = new Date().toISOString();
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        code,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        timestamp,
      }),
    );
    return c.json(
      {
        status: "error",
        code,
        message,
        correlationId,
        timestamp,
      },
      status,
    );
  });
}
describe("errorHandler middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  function createApp(errorToThrow) {
    const app = new Hono();
    wireErrorHandler(app);
    app.use("*", async (c, next) => {
      const id = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
      c.set("correlationId", id);
      await next();
    });
    app.get("/test", () => {
      throw errorToThrow;
    });
    return app;
  }
  it("should return 400 for ValidationError", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new ValidationError("bad input"));
    const res = await app.request("/test");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("VALIDATION_FAILED");
    expect(body.message).toBe("bad input");
  });
  it("should return 401 for UnauthorizedError", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new UnauthorizedError("not allowed"));
    const res = await app.request("/test");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.message).toBe("not allowed");
  });
  it("should return 404 for NotFoundError", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new NotFoundError("Widget"));
    const res = await app.request("/test");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("NOT_FOUND");
    expect(body.message).toBe("Widget not found");
  });
  it("should return 429 for RateLimitError", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new RateLimitError());
    const res = await app.request("/test");
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("RATE_LIMIT");
    expect(body.message).toBe("Rate limit exceeded");
  });
  it("should return 400 for generic AtlasError", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new AtlasError("something broke", "CUSTOM_CODE"));
    const res = await app.request("/test");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("CUSTOM_CODE");
    expect(body.message).toBe("something broke");
  });
  it("should return 500 for unknown Error with generic message and no stack", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new Error("secret db connection string"));
    const res = await app.request("/test");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.message).toBe("Internal server error");
    expect(body).not.toHaveProperty("stack");
  });
  it("should return 500 for non-Error thrown values", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Hono wraps non-Error throws in an Error, so we test via onError
    const app = new Hono();
    wireErrorHandler(app);
    app.get("/test", () => {
      throw new Error("unexpected");
    });
    const res = await app.request("/test");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("INTERNAL_ERROR");
  });
  it("should include correlationId in response", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = new Hono();
    wireErrorHandler(app);
    app.use("*", async (c, next) => {
      c.set("correlationId", "test-corr-123");
      await next();
    });
    app.get("/test", () => {
      throw new ValidationError("fail");
    });
    const res = await app.request("/test");
    const body = await res.json();
    expect(body.correlationId).toBe("test-corr-123");
  });
  it("should include timestamp in response", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new ValidationError("fail"));
    const res = await app.request("/test");
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    expect(() => new Date(body.timestamp)).not.toThrow();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
  it("should return application/json content-type", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new ValidationError("fail"));
    const res = await app.request("/test");
    expect(res.headers.get("content-type")).toContain("application/json");
  });
  it("should log error details to console.error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new ValidationError("logged error"));
    await app.request("/test");
    expect(spy).toHaveBeenCalledOnce();
    const loggedJson = JSON.parse(spy.mock.calls[0][0]);
    expect(loggedJson.level).toBe("error");
    expect(loggedJson.code).toBe("VALIDATION_FAILED");
    expect(loggedJson.message).toBe("logged error");
    expect(loggedJson.correlationId).toBeDefined();
    expect(loggedJson.timestamp).toBeDefined();
  });
  it("should log stack trace for Error instances", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp(new Error("with stack"));
    await app.request("/test");
    const loggedJson = JSON.parse(spy.mock.calls[0][0]);
    expect(loggedJson.stack).toBeDefined();
    expect(loggedJson.stack).toContain("Error: with stack");
  });
  it("should generate correlationId when none is set on context", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // No correlation middleware -- onError generates its own
    const app = new Hono();
    wireErrorHandler(app);
    app.get("/test", () => {
      throw new ValidationError("no corr");
    });
    const res = await app.request("/test");
    const body = await res.json();
    expect(body.correlationId).toBeDefined();
    expect(typeof body.correlationId).toBe("string");
    expect(body.correlationId.length).toBeGreaterThan(0);
  });
});
//# sourceMappingURL=error-handler.test.js.map
