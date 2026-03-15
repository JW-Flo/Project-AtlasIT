import { describe, it, expect, beforeEach } from "vitest";
import { moveToDeadLetter } from "../../ai-orchestrator/src/lib/dead-letter";
import app from "../../ai-orchestrator/src/index";

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

  function makeMethods(sql: string, params: unknown[]) {
    return {
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
          const groupCol = sql.match(/GROUP BY\s+(\w+)/i)?.[1];
          if (groupCol) {
            const groups = new Map<unknown, Row[]>();
            const filtered = applyWhereFilters(rows, sql, params);
            for (const row of filtered) {
              const key = row[groupCol];
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key)!.push(row);
            }
            const results: Row[] = [];
            for (const [key, groupRows] of groups) {
              results.push({ [groupCol]: key, count: groupRows.length });
            }
            return { results };
          }
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
            tables[tableName] = rows.filter(
              (row) => !matchesWhereClause(row, sql, params),
            );
          }
        }

        return { success: true };
      },
    };
  }

  const db = {
    prepare: (sql: string) => ({
      // Direct methods (no bind) -- D1 allows prepare().first() without bind()
      ...makeMethods(sql, []),
      bind: (...params: unknown[]) => makeMethods(sql, params),
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
  const whereMatch = sql.match(
    /WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|\s*$)/i,
  );
  if (!whereMatch) return [...rows];

  const conditions = whereMatch[1].split(/\s+AND\s+/i);
  let paramIndex = 0;

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
  row.dead_lettered_at = row.dead_lettered_at ?? new Date().toISOString();
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
    const fnMatch = assignment.match(/(\w+)\s*=\s*'(\w+)'/);
    const dtMatch = assignment.match(/(\w+)\s*=\s*datetime/);
    if (eqMatch) {
      updates[eqMatch[1]] = params[paramIdx++];
    } else if (fnMatch) {
      updates[fnMatch[1]] = fnMatch[2];
    } else if (dtMatch) {
      updates[dtMatch[1]] = new Date().toISOString();
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

describe("Dead letter queue integration", () => {
  let mockDB: MockDB;
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    mockDB = createMockDB();
    env = createMockEnv(mockDB);
  });

  describe("moveToDeadLetter", () => {
    it("inserts entry and updates delivery status", async () => {
      // Seed a delivery record
      mockDB.tables.event_deliveries.push({
        id: "del-1",
        event_id: "evt-1",
        agent_id: "agent-1",
        status: "failed",
        attempts: 3,
        created_at: new Date().toISOString(),
      });

      const dlqId = await moveToDeadLetter(env.DB, {
        eventId: "evt-1",
        agentId: "agent-1",
        deliveryId: "del-1",
        tenantId: "tenant-1",
        eventType: "user.created",
        eventSource: "core-api",
        eventPayload: '{"userId":"u-1"}',
        errorMessage: "HTTP 500: Internal Server Error",
        totalAttempts: 3,
        firstAttemptAt: "2026-03-15T00:00:00Z",
        lastAttemptAt: "2026-03-15T00:05:00Z",
      });

      expect(dlqId).toBeDefined();
      expect(typeof dlqId).toBe("string");

      // Verify DLQ entry was inserted
      expect(mockDB.tables.dead_letter_queue).toHaveLength(1);
      const dlqEntry = mockDB.tables.dead_letter_queue[0];
      expect(dlqEntry.event_id).toBe("evt-1");
      expect(dlqEntry.agent_id).toBe("agent-1");
      expect(dlqEntry.error_message).toBe("HTTP 500: Internal Server Error");
      expect(dlqEntry.total_attempts).toBe(3);

      // Verify delivery status was updated to dead_letter
      const delivery = mockDB.tables.event_deliveries[0];
      expect(delivery.status).toBe("dead_letter");
    });
  });

  describe("GET /api/v1/dead-letter", () => {
    it("lists dead letter entries", async () => {
      // Seed DLQ entries
      mockDB.tables.dead_letter_queue.push(
        {
          id: "dlq-1",
          event_id: "evt-1",
          agent_id: "agent-1",
          delivery_id: "del-1",
          tenant_id: "tenant-1",
          event_type: "user.created",
          event_source: "core-api",
          error_message: "HTTP 500",
          total_attempts: 3,
          dead_lettered_at: new Date().toISOString(),
          replay_status: null,
        },
        {
          id: "dlq-2",
          event_id: "evt-2",
          agent_id: "agent-2",
          delivery_id: "del-2",
          tenant_id: "tenant-1",
          event_type: "user.updated",
          event_source: "core-api",
          error_message: "Connection refused",
          total_attempts: 3,
          dead_lettered_at: new Date().toISOString(),
          replay_status: null,
        },
      );

      const res = await app.request(
        "/api/v1/dead-letter",
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(2);
    });
  });

  describe("GET /api/v1/dead-letter/stats/summary", () => {
    it("returns depth and breakdown", async () => {
      // Seed DLQ entries with different agents and event types
      mockDB.tables.dead_letter_queue.push(
        {
          id: "dlq-1",
          event_id: "evt-1",
          agent_id: "agent-1",
          event_type: "user.created",
          replay_status: null,
          dead_lettered_at: new Date().toISOString(),
        },
        {
          id: "dlq-2",
          event_id: "evt-2",
          agent_id: "agent-1",
          event_type: "user.created",
          replay_status: null,
          dead_lettered_at: new Date().toISOString(),
        },
        {
          id: "dlq-3",
          event_id: "evt-3",
          agent_id: "agent-2",
          event_type: "user.updated",
          replay_status: null,
          dead_lettered_at: new Date().toISOString(),
        },
      );

      const res = await app.request(
        "/api/v1/dead-letter/stats/summary",
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.depth).toBe(3);
      expect(body.data.byAgent).toBeDefined();
      expect(body.data.byEventType).toBeDefined();
    });
  });

  describe("GET /api/v1/dead-letter/:id", () => {
    it("returns single entry", async () => {
      mockDB.tables.dead_letter_queue.push({
        id: "dlq-1",
        event_id: "evt-1",
        agent_id: "agent-1",
        delivery_id: "del-1",
        tenant_id: "tenant-1",
        event_type: "user.created",
        event_source: "core-api",
        error_message: "HTTP 500",
        total_attempts: 3,
        dead_lettered_at: new Date().toISOString(),
        replay_status: null,
      });

      const res = await app.request(
        "/api/v1/dead-letter/dlq-1",
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.id).toBe("dlq-1");
      expect(body.data.event_id).toBe("evt-1");
      expect(body.data.error_message).toBe("HTTP 500");
    });

    it("returns 404 for missing entry", async () => {
      const res = await app.request(
        "/api/v1/dead-letter/nonexistent",
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("NOT_FOUND");
    });
  });
});
