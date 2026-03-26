import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../../ai-orchestrator/src/index";

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

  // Track unique constraints: table -> column -> values
  const uniqueIndexes: Record<string, Set<unknown>> = {
    "agent_registry.name": new Set(),
    "event_subscriptions.agent_id+event_type": new Set(),
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

            // Check unique constraints
            if (tableName === "agent_registry" && row.name != null) {
              const nameSet = uniqueIndexes["agent_registry.name"];
              if (nameSet.has(row.name)) {
                throw new Error(
                  "UNIQUE constraint failed: agent_registry.name",
                );
              }
              nameSet.add(row.name);
            }

            if (
              tableName === "event_subscriptions" &&
              row.agent_id != null &&
              row.event_type != null
            ) {
              const key = `${row.agent_id}:${row.event_type}`;
              const subSet =
                uniqueIndexes["event_subscriptions.agent_id+event_type"];
              if (subSet.has(key)) {
                throw new Error(
                  "UNIQUE constraint failed: event_subscriptions.agent_id, event_subscriptions.event_type",
                );
              }
              subSet.add(key);
            }

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
            const rows = tables[tableName] ?? [];
            const toRemove = rows.filter((row) =>
              matchesWhereClause(row, sql, params),
            );

            // Clean up unique indexes
            for (const row of toRemove) {
              if (tableName === "agent_registry" && row.name != null) {
                uniqueIndexes["agent_registry.name"].delete(row.name);
              }
              if (
                tableName === "event_subscriptions" &&
                row.agent_id != null &&
                row.event_type != null
              ) {
                uniqueIndexes["event_subscriptions.agent_id+event_type"].delete(
                  `${row.agent_id}:${row.event_type}`,
                );
              }
            }

            tables[tableName] = rows.filter(
              (row) => !matchesWhereClause(row, sql, params),
            );
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
  row.updated_at = new Date().toISOString();
  row.status = row.status ?? "active";
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

const validAgentPayload = {
  name: "slack-notifier",
  description: "Sends Slack notifications",
  webhookUrl: "https://agent.example.com/webhook",
  capabilities: ["notify"],
  healthCheckUrl: "https://agent.example.com/health",
  eventTypes: ["user.created", "user.updated"],
};

describe("Agent registry integration", () => {
  let mockDB: MockDB;
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    mockDB = createMockDB();
    env = createMockEnv(mockDB);
  });

  describe("POST /api/v1/agents", () => {
    it("registers agent and returns secret", async () => {
      const res = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBe("slack-notifier");
      expect(body.data.secret).toBeDefined();
      expect(body.data.secret).toMatch(/^[0-9a-f]{64}$/);
      expect(body.data.eventTypes).toEqual(["user.created", "user.updated"]);
      expect(body.data.status).toBe("active");

      // Verify agent was stored
      expect(mockDB.tables.agent_registry).toHaveLength(1);
      // Verify subscriptions were created
      expect(mockDB.tables.event_subscriptions).toHaveLength(2);
    });

    it("returns 409 for duplicate name", async () => {
      // Register first agent
      await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );

      // Try to register with same name
      const res = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("CONFLICT");
    });
  });

  describe("GET /api/v1/agents", () => {
    it("lists registered agents", async () => {
      // Register two agents
      await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );
      await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...validAgentPayload, name: "email-sender" }),
        },
        env,
      );

      const res = await app.request("/api/v1/agents", { method: "GET" }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(2);
    });
  });

  describe("GET /api/v1/agents/:id", () => {
    it("returns agent with subscriptions", async () => {
      const createRes = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );
      const created = await createRes.json();
      const agentId = created.data.id;

      const res = await app.request(
        `/api/v1/agents/${agentId}`,
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.id).toBe(agentId);
      expect(body.data.name).toBe("slack-notifier");
      expect(body.data.eventTypes).toBeDefined();
      expect(body.data.deliveryStats).toBeDefined();
    });
  });

  describe("PATCH /api/v1/agents/:id", () => {
    it("updates agent", async () => {
      const createRes = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );
      const created = await createRes.json();
      const agentId = created.data.id;

      const res = await app.request(
        `/api/v1/agents/${agentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: "Updated description",
            status: "inactive",
          }),
        },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.description).toBe("Updated description");
      expect(body.data.status).toBe("inactive");
    });
  });

  describe("DELETE /api/v1/agents/:id", () => {
    it("deregisters agent and removes subscriptions", async () => {
      const createRes = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );
      const created = await createRes.json();
      const agentId = created.data.id;

      expect(mockDB.tables.agent_registry).toHaveLength(1);
      expect(mockDB.tables.event_subscriptions).toHaveLength(2);

      const res = await app.request(
        `/api/v1/agents/${agentId}`,
        { method: "DELETE" },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.deleted).toBe(true);

      // Verify agent and subscriptions were removed
      expect(mockDB.tables.agent_registry).toHaveLength(0);
      expect(mockDB.tables.event_subscriptions).toHaveLength(0);
    });
  });

  describe("POST /api/v1/agents/:id/subscriptions", () => {
    it("adds event subscription", async () => {
      const createRes = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );
      const created = await createRes.json();
      const agentId = created.data.id;

      const res = await app.request(
        `/api/v1/agents/${agentId}/subscriptions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "user.deleted" }),
        },
        env,
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.eventType).toBe("user.deleted");
      expect(body.data.agentId).toBe(agentId);

      // Verify subscription was added (2 initial + 1 new)
      expect(mockDB.tables.event_subscriptions).toHaveLength(3);
    });

    it("returns 409 for duplicate subscription", async () => {
      const createRes = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validAgentPayload),
        },
        env,
      );
      const created = await createRes.json();
      const agentId = created.data.id;

      // Try to subscribe to an event type that's already subscribed
      const res = await app.request(
        `/api/v1/agents/${agentId}/subscriptions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "user.created" }),
        },
        env,
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("CONFLICT");
    });
  });
});
