import type { MiddlewareHandler } from "hono";
import { z } from "zod";
declare const RateLimitConfigSchema: z.ZodObject<
  {
    tenantIdHeader: z.ZodDefault<z.ZodString>;
    keyPrefix: z.ZodDefault<z.ZodString>;
    defaultLimit: z.ZodNumber;
    windowSeconds: z.ZodDefault<z.ZodNumber>;
    endpointLimits: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    namespaceBinding: z.ZodDefault<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    tenantIdHeader: string;
    keyPrefix: string;
    defaultLimit: number;
    windowSeconds: number;
    endpointLimits: Record<string, number>;
    namespaceBinding: string;
  },
  {
    defaultLimit: number;
    tenantIdHeader?: string | undefined;
    keyPrefix?: string | undefined;
    windowSeconds?: number | undefined;
    endpointLimits?: Record<string, number> | undefined;
    namespaceBinding?: string | undefined;
  }
>;
export type RateLimitConfig = z.input<typeof RateLimitConfigSchema>;
export declare function rateLimitMiddleware(
  config: RateLimitConfig,
): MiddlewareHandler;
export {};
//# sourceMappingURL=rate-limit.d.ts.map
