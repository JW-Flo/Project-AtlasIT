import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../../ai-orchestrator/src/index";
import { signPayload } from "../../ai-orchestrator/src/lib/hmac";

type Row = Record<string, unknown>;

interface MockDB {
  tables: Record<string, Row[]>;
  db: {
    prepare: (sql: string) => {
      bind: (...params: unknown[]) => {
        first: <T = Row>() => Promise<T | null>;
        all: () => Promise<{ results: Row[] }>;
        run: () => Promise<{ success: boolean }>;
      };
    };
  };
}

function createMockDB(): MockDB {
  const tables: Record<string, Row[]> = {
    events: [],
    agent_registry: [],
    event_subscriptions: [],
    event_deliveries: [],
    dead_letter_queue: [],
  };

  const db = {
    prepare: (sql: string) => ({
      bind: (...params: unknown[]) => ({
        first: async <T = Row>(): Promise<T | null> => {
          const tableName = extractTableName(sql);
          const rows = tables[tableName] ?? [];

          if (sql.includes("COUNT(*)")) {
            const filtered = applyWhereFilters(rows, sql, params);
            return {
              count: filtered.length,
              total: filtered.length,
            } as unknown as T;
          }

          if (sql.includes("GROUP BY")) {
            return null;
          }

          const filtered = applyWhereFilters(rows, sql, params);
          return (filtered[0] as T) ?? null;
        },
        all: async (): Promise<{ results: Row[] }> => {
          const tableName = extractTableName(sql);
          const rows = tables[tableName] ?? [];

          if (sql.includes("GROUP BY")) {
            return { results: [] };
          }

          const filtered = applyWhereFilters(rows, sql, params);
          return { results: filtered };
        },
        run: async (): Promise<{ success: boolean }> => {
          const tableName = extractTableName(sql);
          const upperSql = sql.trim().toUpperCase();

          if (upperSql.startsWith("INSERT")) {
            const row = buildInsertRow(sql, params);
            if (!tables[tableName]) tables[tableName] = [];
            tables[tableName].push(row);
          } else if (upperSql.startsWith("UPDATE")) {
            const updates = buildUpdateFields(sql, params);
            const rows = tables[tableName] ?? [];
            for (const row of rows) {
              if (matchesWhereClause(row, sql, params)) {
                Object.assign(row, updates);
              }
            }
          } else if (upperSql.startsWith("DELETE")) {
            if (tables[tableName]) {
              tables[tableName] = rows.filter((row) => !matchesWhereClause(row, sql, params));
            }
          }

          return { success: true };
        },
      }),
    }),
  };

  return { tables, db };
}

function extractTableName(sql: string): string {
  const upper = sql.toUpperCase();
  let match: RegExpMatchArray | null;

  if (upper.includes("FROM")) {
    match = sql.match(/FROM\s+(\w+)/i);
  } else if (upper.includes("INTO")) {
    match = sql.match(/INTO\s+(\w+)/i);
  } else if (upper.includes("UPDATE")) {
    match = sql.match(/UPDATE\s+(\w+)/i);
  } else {
    match = null;
  }

  return match?.[1] ?? "unknown";
}

function applyWhereFilters(rows: Row[], sql: string, params: unknown[]): Row[] {
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|\s*$)/i);
  if (!whereMatch) return [...rows];

  const conditions = whereMatch[1].split(/\s+AND\s+/i);
  let paramIndex = 0;

  // Count params used before WHERE for UPDATE SET clauses
  const upperSql = sql.trim().toUpperCase();
  if (upperSql.startsWith("UPDATE")) {
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    if (setMatch) {
      paramIndex = (setMatch[1].match(/\?/g) ?? []).length;
    }
  }

  return rows.filter((row) => {
    let localIdx = paramIndex;
    return conditions.every((cond) => {
      const eqMatch = cond.trim().match(/(\w+)\s*=\s*\?/);
      const isNullMatch = cond.trim().match(/(\w+)\s+IS\s+NULL/i);

      if (eqMatch) {
        const col = eqMatch[1];
        const val = params[localIdx++];
        return row[col] === val;
      }
      if (isNullMatch) {
        const col = isNullMatch[1];
        return row[col] == null;
      }
      return true;
    });
  });
}

function matchesWhereClause(row: Row, sql: string, params: unknown[]): boolean {
  const filtered = applyWhereFilters([row], sql, params);
  return filtered.length > 0;
}

function buildInsertRow(sql: string, params: unknown[]): Row {
  const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
  if (!colMatch) return {};
  const columns = colMatch[1].split(",").map((c) => c.trim());
  const row: Row = {};
  columns.forEach((col, i) => {
    row[col] = params[i] ?? null;
  });
  row.created_at = new Date().toISOString();
  return row;
}

function buildUpdateFields(sql: string, params: unknown[]): Row {
  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
  if (!setMatch) return {};
  const assignments = setMatch[1].split(",").map((a) => a.trim());
  const updates: Row = {};
  let paramIdx = 0;
  for (const assignment of assignments) {
    const eqMatch = assignment.match(/(\w+)\s*=\s*\?/);
    const fnMatch = assignment.match(/(\w+)\s*=\s*\w+\(/);
    if (eqMatch) {
      updates[eqMatch[1]] = params[paramIdx++];
    } else if (fnMatch) {
      updates[fnMatch[1]] = new Date().toISOString();
    }
  }
  return updates;
}

function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async () => ({
      value: null,
      metadata: null,
      cacheStatus: null,
    }),
  } as unknown as KVNamespace;
}

function createMockEnv(mockDB: MockDB) {
  return {
    DB: mockDB.db as unknown as D1Database,
    TASKS: createMockKV(),
    AI_QUOTA: createMockKV(),
    IDEMPOTENCY_CACHE: createMockKV(),
    WORKFLOW: {} as DurableObjectNamespace,
  };
}

describe("Event flow integration", () => {
  let mockDB: MockDB;
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    mockDB = createMockDB();
    env = createMockEnv(mockDB);
  });

  describe("POST /api/v1/events", () => {
    it("creates event with valid payload", async () => {
      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "tenant-1",
            type: "user.created",
            source: "core-api",
            payload: { userId: "u-1" },
          }),
        },
        env,
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.type).toBe("user.created");
      expect(body.data.source).toBe("core-api");
      expect(body.data.status).toBe("processing");
      expect(body.data.id).toBeDefined();
      expect(body.correlationId).toBeDefined();

      // Verify event was stored in mock DB
      expect(mockDB.tables.events).toHaveLength(1);
      expect(mockDB.tables.events[0].tenant_id).toBe("tenant-1");
      expect(mockDB.tables.events[0].type).toBe("user.created");
    });

    it("returns 400 for invalid payload", async () => {
      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId: "" }),
        },
        env,
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("VALIDATION_FAILED");
    });

    it("handles idempotency via KV check", async () => {
      const idempotencyKey = "idem-key-123";

      // First request creates the event
      const res1 = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "tenant-1",
            type: "user.created",
            source: "core-api",
            idempotencyKey,
          }),
        },
        env,
      );

      expect(res1.status).toBe(201);
      const body1 = await res1.json();
      expect(body1.data.id).toBeDefined();

      // Second request with same key returns cached result
      const res2 = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "tenant-1",
            type: "user.created",
            source: "core-api",
            idempotencyKey,
          }),
        },
        env,
      );

      expect(res2.status).toBe(200);
      const body2 = await res2.json();
      expect(body2.deduplicated).toBe(true);
      expect(body2.data.id).toBe(body1.data.id);

      // Only one event stored
      expect(mockDB.tables.events).toHaveLength(1);
    });
  });

  describe("GET /api/v1/events", () => {
    it("lists events", async () => {
      // Seed events — tenant_id must match what apiAuth sets when no
      // X-Tenant-ID header is provided (falls back to "default").
      mockDB.tables.events.push(
        {
          id: "evt-1",
          tenant_id: "default",
          type: "user.created",
          source: "api",
          status: "completed",
          created_at: new Date().toISOString(),
        },
        {
          id: "evt-2",
          tenant_id: "default",
          type: "user.updated",
          source: "api",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      );

      const res = await app.request("/api/v1/events", { method: "GET" }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(2);
      expect(body.meta).toBeDefined();
    });
  });

  describe("GET /api/v1/events/:id", () => {
    it("returns event with delivery status", async () => {
      // tenant_id must match what apiAuth sets when no X-Tenant-ID header is
      // provided (falls back to "default"), since the GET /:id route filters
      // by both id and tenant_id.
      mockDB.tables.events.push({
        id: "evt-1",
        tenant_id: "default",
        type: "user.created",
        source: "api",
        status: "completed",
        created_at: new Date().toISOString(),
      });
      mockDB.tables.event_deliveries.push({
        id: "del-1",
        event_id: "evt-1",
        agent_id: "agent-1",
        status: "delivered",
        attempts: 1,
      });

      const res = await app.request("/api/v1/events/evt-1", { method: "GET" }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.id).toBe("evt-1");
      expect(body.data.deliveries).toHaveLength(1);
      expect(body.data.deliveries[0].status).toBe("delivered");
    });

    it("returns 404 for missing event", async () => {
      const res = await app.request("/api/v1/events/nonexistent", { method: "GET" }, env);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("NOT_FOUND");
    });
  });

  describe("POST /api/v1/events — HMAC signature verification", () => {
    const sourceSecret = "source-hmac-secret-for-tests";

    function createSignedEnv(
      mockDB: MockDB,
      opts: {
        requireSignatures?: boolean;
        sourceSecrets?: Record<string, string>;
      } = {},
    ) {
      return {
        DB: mockDB.db as unknown as D1Database,
        TASKS: createMockKV(),
        AI_QUOTA: createMockKV(),
        IDEMPOTENCY_CACHE: createMockKV(),
        WORKFLOW: {} as DurableObjectNamespace,
        EVENT_SOURCE_SECRETS: opts.sourceSecrets ? JSON.stringify(opts.sourceSecrets) : undefined,
        REQUIRE_EVENT_SIGNATURES: opts.requireSignatures ? "true" : undefined,
      };
    }

    it("accepts event with valid HMAC signature", async () => {
      const signedEnv = createSignedEnv(mockDB, {
        sourceSecrets: { "core-api": sourceSecret },
      });

      const eventPayload = JSON.stringify({
        tenantId: "tenant-1",
        type: "user.created",
        source: "core-api",
        payload: { userId: "u-1" },
      });

      const signature = await signPayload(eventPayload, sourceSecret);

      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Signature": signature,
          },
          body: eventPayload,
        },
        signedEnv,
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.type).toBe("user.created");
    });

    it("rejects event with invalid HMAC signature", async () => {
      const signedEnv = createSignedEnv(mockDB, {
        sourceSecrets: { "core-api": sourceSecret },
      });

      const eventPayload = JSON.stringify({
        tenantId: "tenant-1",
        type: "user.created",
        source: "core-api",
      });

      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Signature": "deadbeef".repeat(8),
          },
          body: eventPayload,
        },
        signedEnv,
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe("UNAUTHORIZED");
      expect(body.message).toContain("Invalid event signature");
    });

    it("rejects event without signature when signatures are required", async () => {
      const signedEnv = createSignedEnv(mockDB, {
        requireSignatures: true,
        sourceSecrets: { "core-api": sourceSecret },
      });

      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "tenant-1",
            type: "user.created",
            source: "core-api",
          }),
        },
        signedEnv,
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe("UNAUTHORIZED");
      expect(body.message).toContain("Event signature required");
    });

    it("accepts event without signature when signatures are not required", async () => {
      // No REQUIRE_EVENT_SIGNATURES set, no X-Signature header
      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "tenant-1",
            type: "user.created",
            source: "core-api",
          }),
        },
        env,
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("success");
    });
  });
});
