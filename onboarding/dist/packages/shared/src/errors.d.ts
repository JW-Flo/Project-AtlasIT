export declare class AtlasError extends Error {
  readonly code?: string | undefined;
  readonly meta?: Record<string, any> | undefined;
  constructor(
    message: string,
    code?: string | undefined,
    meta?: Record<string, any> | undefined,
  );
}
export declare class NotFoundError extends AtlasError {
  constructor(resource: string, meta?: Record<string, any>);
}
export declare class ValidationError extends AtlasError {
  constructor(message: string, meta?: Record<string, any>);
}
export declare class UnauthorizedError extends AtlasError {
  constructor(message?: string, meta?: Record<string, any>);
}
export declare class RateLimitError extends AtlasError {
  constructor(message?: string, meta?: Record<string, any>);
}
export declare function toErrorResponse(error: unknown): Response;
//# sourceMappingURL=errors.d.ts.map
