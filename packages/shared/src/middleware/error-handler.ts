import type { MiddlewareHandler } from "hono";
import {
  AtlasError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  RateLimitError,
} from "../errors.js";

interface AuthErrorLike {
  name: string;
  status: number;
  message: string;
}

function isAuthError(err: unknown): err is AuthErrorLike {
  return err instanceof Error && err.name === "AuthError" && "status" in err;
}

function getHttpStatus(err: unknown): number {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ValidationError) return 400;
  if (err instanceof UnauthorizedError) return 401;
  if (err instanceof RateLimitError) return 429;
  if (isAuthError(err)) return (err as AuthErrorLike).status;
  if (err instanceof AtlasError) return 400;
  return 500;
}

function getErrorCode(err: unknown): string {
  if (err instanceof AtlasError) return err.code ?? "INTERNAL_ERROR";
  if (isAuthError(err)) return "AUTH_ERROR";
  return "INTERNAL_ERROR";
}

function getSafeMessage(err: unknown, status: number): string {
  if (err instanceof AtlasError) return err.message;
  if (isAuthError(err)) return (err as AuthErrorLike).message;
  if (status === 500) return "Internal server error";
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export function errorHandler(): MiddlewareHandler {
  return async (c, next) => {
    try {
      await next();
    } catch (err) {
      const correlationId = c.get("correlationId") ?? crypto.randomUUID();
      const status = getHttpStatus(err);
      const code = getErrorCode(err);
      const message = getSafeMessage(err, status);
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
          status: "error" as const,
          code,
          message,
          correlationId,
          timestamp,
        },
        status as any,
      );
    }
  };
}
