import type { MiddlewareHandler } from "hono";
export declare function featureFlagMiddleware(
  flagKey: string,
): MiddlewareHandler;
export declare function featureFlagGuard(flagKey: string): MiddlewareHandler;
//# sourceMappingURL=middleware.d.ts.map
