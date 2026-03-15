import type { MiddlewareHandler } from "hono";
import { getFlag } from "./store.js";
import { evaluateFlag } from "./evaluator.js";

export function featureFlagMiddleware(flagKey: string): MiddlewareHandler {
  return async (c, next) => {
    const kv = (c.env as Record<string, KVNamespace>).KV_FEATURE_FLAGS;
    const tenantId = c.get("tenantId") as string;

    const flag = await getFlag(kv, flagKey);
    if (!flag) {
      return c.json(
        {
          status: "error" as const,
          code: "NOT_FOUND",
          message: "Feature not available",
          timestamp: new Date().toISOString(),
        },
        404,
      );
    }

    const result = evaluateFlag(flag, { tenantId });
    if (!result.enabled) {
      return c.json(
        {
          status: "error" as const,
          code: "NOT_FOUND",
          message: "Feature not available",
          timestamp: new Date().toISOString(),
        },
        404,
      );
    }

    await next();
  };
}

export function featureFlagGuard(flagKey: string): MiddlewareHandler {
  return async (c, next) => {
    const kv = (c.env as Record<string, KVNamespace>).KV_FEATURE_FLAGS;
    const tenantId = c.get("tenantId") as string;

    const flag = await getFlag(kv, flagKey);
    if (!flag) {
      return c.json(
        {
          status: "error" as const,
          code: "FORBIDDEN",
          message: "Feature not enabled for your tier",
          timestamp: new Date().toISOString(),
        },
        403,
      );
    }

    const result = evaluateFlag(flag, { tenantId });
    if (!result.enabled) {
      return c.json(
        {
          status: "error" as const,
          code: "FORBIDDEN",
          message: "Feature not enabled for your tier",
          timestamp: new Date().toISOString(),
        },
        403,
      );
    }

    await next();
  };
}
