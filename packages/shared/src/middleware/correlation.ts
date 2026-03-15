import type { MiddlewareHandler } from "hono";

declare module "hono" {
  interface ContextVariableMap {
    correlationId: string;
  }
}

const HEADER = "X-Correlation-ID";

export function correlationId(): MiddlewareHandler {
  return async (c, next) => {
    const id = c.req.header(HEADER) ?? crypto.randomUUID();
    c.set("correlationId", id);
    c.header(HEADER, id);
    await next();
  };
}
