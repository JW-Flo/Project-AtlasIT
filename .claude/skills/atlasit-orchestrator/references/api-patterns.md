# API Patterns Reference

## Hono Router Structure

```typescript
// src/index.ts - Main entry
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiRouter } from "./routers/api";

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  TESSIE_API_KEY: string;
  ADMIN_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["https://awhittlewandering.com", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Mount routers
app.route("/api/v1", apiRouter);

export default app;
```

## Router Organization

```
src/routers/
├── api.ts          # Main API router, mounts sub-routers
├── health.ts       # Health/status endpoints
├── telemetry.ts    # Vehicle data endpoints
├── admin.ts        # Admin operations (protected)
└── journey.ts      # Trip/journey data
```

## Middleware Patterns

### Rate Limiting

```typescript
import { rateLimiter } from "hono-rate-limiter";

const limiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  keyGenerator: (c) => c.req.header("CF-Connecting-IP") || "unknown",
});

app.use("/api/*", limiter);
```

### Authentication

```typescript
import { bearerAuth } from "hono/bearer-auth";

// Admin routes
app.use(
  "/api/v1/admin/*",
  bearerAuth({
    token: async (token, c) => token === c.env.ADMIN_TOKEN,
  }),
);

// Custom auth middleware
const requireAuth = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token, c.env))) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
```

### Error Handling

```typescript
app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

  if (err instanceof ZodError) {
    return c.json(
      {
        status: "error",
        error: "Validation failed",
        details: err.errors,
      },
      400,
    );
  }

  return c.json(
    {
      status: "error",
      error: "Internal server error",
      requestId: c.req.header("CF-Ray"),
    },
    500,
  );
});
```

## Zod Validation Schemas

```typescript
// src/schemas/telemetry.ts
import { z } from "zod";

export const TelemetrySchema = z.object({
  batteryLevel: z.number().min(0).max(100),
  batteryRange: z.number().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  isCharging: z.boolean(),
  chargerPower: z.number().optional(),
  timestamp: z.string().datetime(),
});

export const QueryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type Telemetry = z.infer<typeof TelemetrySchema>;
```

## Response Patterns

```typescript
// Success response
return c.json({
  status: "success",
  data: result,
  meta: {
    count: result.length,
    timestamp: new Date().toISOString(),
  },
});

// Paginated response
return c.json({
  status: "success",
  data: items,
  pagination: {
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  },
});

// Error response
return c.json(
  {
    status: "error",
    error: "Resource not found",
    code: "NOT_FOUND",
  },
  404,
);
```

## D1 Query Helpers

```typescript
// src/services/db.ts

export async function findById<T>(db: D1Database, table: string, id: string): Promise<T | null> {
  const result = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<T>();
  return result;
}

export async function paginate<T>(
  db: D1Database,
  table: string,
  { limit, offset, orderBy = "created_at DESC" }: PaginateOptions,
): Promise<{ items: T[]; total: number }> {
  const [items, countResult] = await Promise.all([
    db
      .prepare(`SELECT * FROM ${table} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all<T>(),
    db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first<{ count: number }>(),
  ]);

  return {
    items: items.results,
    total: countResult?.count ?? 0,
  };
}

// Transaction pattern
export async function withTransaction<T>(
  db: D1Database,
  operations: D1PreparedStatement[],
): Promise<T[]> {
  const results = await db.batch(operations);
  return results.map((r) => r.results as T);
}
```

## Caching Patterns

```typescript
// src/services/cache.ts

export class CacheService {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.kv.get(key, "json");
    return data as T | null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
  }

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}
```

## External API Integration (Tessie)

```typescript
// src/services/tessie.ts

export class TessieService {
  private baseUrl = "https://api.tessie.com";

  constructor(private apiKey: string) {}

  private async request<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Tessie API error: ${res.status}`);
    }

    return res.json();
  }

  async getVehicleState(vin: string) {
    return this.request<VehicleState>(`/${vin}/state`);
  }

  async getLocation(vin: string) {
    return this.request<Location>(`/${vin}/location`);
  }

  async getBatteryHealth(vin: string) {
    return this.request<BatteryHealth>(`/${vin}/battery_health`);
  }
}
```

## Health Endpoint (Canonical)

```typescript
// INVARIANT: Only add keys, never remove existing ones
app.get("/api/v1/health", async (c) => {
  const checks: Record<string, HealthCheck> = {};

  // D1 check
  try {
    await c.env.DB.prepare("SELECT 1").first();
    checks.database = { status: "healthy", latency: Date.now() - start };
  } catch (e) {
    checks.database = { status: "unhealthy", error: e.message };
  }

  // KV check
  try {
    await c.env.KV.get("health-check");
    checks.kv = { status: "healthy" };
  } catch (e) {
    checks.kv = { status: "unhealthy", error: e.message };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "healthy");

  return c.json({
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks,
  });
});
```
