import type { MiddlewareHandler } from "hono";
import { z } from "zod";
import { RateLimitError } from "../errors.js";

const RateLimitConfigSchema = z.object({
  tenantIdHeader: z.string().min(1).default("X-Tenant-ID"),
  keyPrefix: z.string().min(1).default("ratelimit"),
  defaultLimit: z.number().int().positive(),
  windowSeconds: z.number().int().positive().default(60),
  endpointLimits: z
    .record(z.string().min(1), z.number().int().positive())
    .default({}),
  namespaceBinding: z.string().min(1).default("RATE_LIMIT_KV"),
});

export type RateLimitConfig = z.input<typeof RateLimitConfigSchema>;

interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

function resolveKvNamespace(
  c: { env: unknown },
  bindingName: string,
): KVNamespaceLike {
  const envRecord = c.env as Record<string, unknown>;
  const binding = envRecord[bindingName];

  if (!binding || typeof binding !== "object") {
    throw new Error(`Missing KV namespace binding: ${bindingName}`);
  }

  const namespace = binding as Partial<KVNamespaceLike>;
  if (
    typeof namespace.get !== "function" ||
    typeof namespace.put !== "function"
  ) {
    throw new Error(`Invalid KV namespace binding: ${bindingName}`);
  }

  return namespace as KVNamespaceLike;
}

export function rateLimitMiddleware(
  config: RateLimitConfig,
): MiddlewareHandler {
  const parsed = RateLimitConfigSchema.parse(config);

  return async (c, next) => {
    const tenantId = c.req.header(parsed.tenantIdHeader)?.trim();

    if (!tenantId) {
      throw new RateLimitError("Missing tenant identifier", {
        code: "TENANT_ID_REQUIRED",
      });
    }

    const endpointKey = `${c.req.method.toUpperCase()} ${new URL(c.req.url).pathname}`;
    const limit = parsed.endpointLimits[endpointKey] ?? parsed.defaultLimit;

    const now = Math.floor(Date.now() / 1000);
    const windowBucket = Math.floor(now / parsed.windowSeconds);
    const kvKey = `${parsed.keyPrefix}:${tenantId}:${endpointKey}:${windowBucket}`;

    const kv = resolveKvNamespace(c, parsed.namespaceBinding);
    const currentRaw = await kv.get(kvKey);
    const current = currentRaw ? Number.parseInt(currentRaw, 10) : 0;
    const safeCurrent = Number.isFinite(current) && current >= 0 ? current : 0;

    if (safeCurrent >= limit) {
      throw new RateLimitError("Rate limit exceeded", {
        code: "RATE_LIMIT",
        tenantId,
        endpoint: endpointKey,
        limit,
      });
    }

    await kv.put(kvKey, String(safeCurrent + 1), {
      expirationTtl: parsed.windowSeconds + 1,
    });

    c.header("X-RateLimit-Limit", String(limit));
    c.header(
      "X-RateLimit-Remaining",
      String(Math.max(0, limit - safeCurrent - 1)),
    );
    c.header(
      "X-RateLimit-Reset",
      String((windowBucket + 1) * parsed.windowSeconds),
    );

    await next();
  };
}
