import { getFlag } from "./store.js";
import { evaluateFlag } from "./evaluator.js";
export function featureFlagMiddleware(flagKey) {
  return async (c, next) => {
    const kv = c.env.KV_FEATURE_FLAGS;
    const tenantId = c.get("tenantId");
    const flag = await getFlag(kv, flagKey);
    if (!flag) {
      return c.json(
        {
          status: "error",
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
          status: "error",
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
export function featureFlagGuard(flagKey) {
  return async (c, next) => {
    const kv = c.env.KV_FEATURE_FLAGS;
    const tenantId = c.get("tenantId");
    const flag = await getFlag(kv, flagKey);
    if (!flag) {
      return c.json(
        {
          status: "error",
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
          status: "error",
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
//# sourceMappingURL=middleware.js.map
