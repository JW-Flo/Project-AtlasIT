export class AtlasError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly meta?: Record<string, any>,
  ) {
    super(message);
    this.name = "AtlasError";
  }
}

export class NotFoundError extends AtlasError {
  constructor(resource: string, meta?: Record<string, any>) {
    super(`${resource} not found`, "NOT_FOUND", meta);
    this.name = "NotFoundError";
  }
}
export class ValidationError extends AtlasError {
  constructor(message: string, meta?: Record<string, any>) {
    super(message, "VALIDATION_FAILED", meta);
    this.name = "ValidationError";
  }
}
export class UnauthorizedError extends AtlasError {
  constructor(message = "Unauthorized", meta?: Record<string, any>) {
    super(message, "UNAUTHORIZED", meta);
    this.name = "UnauthorizedError";
  }
}
export class RateLimitError extends AtlasError {
  constructor(message = "Rate limit exceeded", meta?: Record<string, any>) {
    super(message, "RATE_LIMIT", meta);
    this.name = "RateLimitError";
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AtlasError) {
    return new Response(
      JSON.stringify({
        error: error.code,
        message: error.message,
        meta: error.meta,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (error instanceof Error) {
    return new Response(
      JSON.stringify({ error: "INTERNAL", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({ error: "UNKNOWN", message: "Unknown error" }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}
