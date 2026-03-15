import type { MiddlewareHandler } from "hono";
declare module "hono" {
  interface ContextVariableMap {
    correlationId: string;
  }
}
export declare function correlationId(): MiddlewareHandler;
//# sourceMappingURL=correlation.d.ts.map
