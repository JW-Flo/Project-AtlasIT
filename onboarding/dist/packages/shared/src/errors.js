export class AtlasError extends Error {
  code;
  meta;
  constructor(message, code, meta) {
    super(message);
    this.code = code;
    this.meta = meta;
    this.name = "AtlasError";
  }
}
export class NotFoundError extends AtlasError {
  constructor(resource, meta) {
    super(`${resource} not found`, "NOT_FOUND", meta);
    this.name = "NotFoundError";
  }
}
export class ValidationError extends AtlasError {
  constructor(message, meta) {
    super(message, "VALIDATION_FAILED", meta);
    this.name = "ValidationError";
  }
}
export class UnauthorizedError extends AtlasError {
  constructor(message = "Unauthorized", meta) {
    super(message, "UNAUTHORIZED", meta);
    this.name = "UnauthorizedError";
  }
}
export class RateLimitError extends AtlasError {
  constructor(message = "Rate limit exceeded", meta) {
    super(message, "RATE_LIMIT", meta);
    this.name = "RateLimitError";
  }
}
export function toErrorResponse(error) {
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
//# sourceMappingURL=errors.js.map
