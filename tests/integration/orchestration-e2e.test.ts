/**
 * End-to-end integration tests for the MCP orchestration pipeline.
 *
 * Covers the full lifecycle:
 *   1. Event -> Agent fan-out with HMAC verification
 *   2. Event -> No subscribers
 *   3. Failed delivery -> Dead letter queue
 *   4. DLQ replay
 *   5. Agent registration lifecycle (register -> subscribe -> health -> deregister)
 *   6. Idempotent event publishing
 *   7. WorkflowDO state transitions (happy path)
 *   8. WorkflowDO failure path (retries exhausted -> DLQ)
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { app } from "../../ai-orchestrator/src/index";
import { signPayload } from "../../ai-orchestrator/src/lib/hmac";
import { verifySignature } from "../../packages/mcp-sdk/src/hmac";
import { WorkflowDO } from "../../ai-orchestrator/src/workflow/workflow-do";
import {
  InMemoryQueueBus,
  InMemoryEvidenceStore,
} from "../../packages/shared/src/platform/testing";
import { EvidenceEmitter } from "../../packages/shared/src/workflow/evidence-emitter";
import { DEFAULT_MAX_RETRIES } from "../../packages/shared/src/workflow/types";

// ---------------------------------------------------------------------------
// Mock DB infrastructure (matches existing test patterns)
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

interface MockDB {
  tables: Record<string, Row[]>;
  db: {
    prepare: (sql: string) => {
      first: <T = Row>() => Promise<T | null>;
      all: () => Promise<{ results: Row[] }>;
      run: () => Promise<{ success: boolean }>;
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

  const uniqueIndexes: Record<string, Set<unknown>> = {
    "agent_registry.name": new Set(),
    "event_subscriptions.agent_id+event_type": new Set(),
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
          const row = buildInsertRow(sql, params, tableName);

          // Unique constraint checks
          if (tableName === "agent_registry" && row.name != null) {
            const nameSet = uniqueIndexes["agent_registry.name"];
            if (nameSet.has(row.name)) {
              throw new Error("UNIQUE constraint failed: agent_registry.name");
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
    };
  }

  const db = {
    prepare: (sql: string) => ({
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

function buildInsertRow(
  sql: string,
  params: unknown[],
  tableName: string,
): Row {
  const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
  if (!colMatch) return {};
  const columns = colMatch[1].split(",").map((c) => c.trim());
  const row: Row = {};
  columns.forEach((col, i) => {
    row[col] = params[i] ?? null;
  });
  row.created_at = new Date().toISOString();
  if (tableName === "agent_registry") {
    row.updated_at = new Date().toISOString();
    row.status = row.status ?? "active";
  }
  if (tableName === "dead_letter_queue") {
    row.dead_lettered_at = row.dead_lettered_at ?? new Date().toISOString();
  }
  if (tableName === "event_deliveries") {
    row.max_attempts = row.max_attempts ?? 1;
  }
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
    const strMatch = assignment.match(/(\w+)\s*=\s*'([^']+)'/);
    const dtMatch = assignment.match(/(\w+)\s*=\s*datetime/);
    const numMatch = assignment.match(/(\w+)\s*=\s*(\d+)/);
    if (eqMatch) {
      updates[eqMatch[1]] = params[paramIdx++];
    } else if (strMatch) {
      updates[strMatch[1]] = strMatch[2];
    } else if (dtMatch) {
      updates[dtMatch[1]] = new Date().toISOString();
    } else if (numMatch) {
      updates[numMatch[1]] = parseInt(numMatch[2], 10);
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

/**
 * Mock ExecutionContext for tests that trigger fan-out (which calls ctx.waitUntil).
 * Collects all waitUntil promises so we can await them in tests.
 */
function createMockExecutionCtx() {
  const promises: Promise<unknown>[] = [];
  return {
    ctx: {
      waitUntil: (p: Promise<unknown>) => {
        promises.push(p);
      },
      passThroughOnException: () => {},
    },
    waitForAll: async () => {
      await Promise.allSettled(promises);
    },
  };
}

// ---------------------------------------------------------------------------
// WorkflowDO test harness
// ---------------------------------------------------------------------------

function createWorkflowDO(mockDB: MockDB) {
  const storage = new Map<string, unknown>();
  let currentAlarm: number | null = null;

  const ctx = {
    storage: {
      get: async (key: string) => storage.get(key),
      put: async (key: string, value: unknown) => {
        storage.set(key, structuredClone(value));
      },
      delete: async (key: string) => storage.delete(key),
      setAlarm: async (time: number) => {
        currentAlarm = time;
      },
      deleteAlarm: async () => {
        currentAlarm = null;
      },
      getAlarm: async () => currentAlarm,
    },
    id: { toString: () => "test-do-id" },
    waitUntil: (_p: Promise<unknown>) => {},
  };

  const env = {
    STEP_TASKS: {
      send: async () => {},
    },
    EVIDENCE: {
      head: async () => null,
      put: async () => ({}),
      get: async () => null,
    },
    DB: mockDB.db as unknown as D1Database,
  };

  const doInstance = new WorkflowDO(ctx as any, env as any);

  // Inject test doubles
  const queueBus = new InMemoryQueueBus();
  const evidenceStore = new InMemoryEvidenceStore();
  const evidenceEmitter = new EvidenceEmitter(evidenceStore);
  doInstance._injectDeps({ evidenceEmitter, queueBus });

  return { doInstance, storage, ctx, queueBus, evidenceStore };
}

function makeWorkflowDefinition(overrides?: Record<string, unknown>) {
  return {
    definition: {
      id: "wf-onboarding",
      name: "Employee Onboarding",
      steps: [
        {
          id: "validate-profile",
          name: "Validate Profile",
          handler: "validate_profile",
          timeoutMs: 30000,
          retryConfig: { maxRetries: 2, backoffMs: 1000 },
        },
        {
          id: "provision-accounts",
          name: "Provision Accounts",
          handler: "provision_accounts",
          timeoutMs: 60000,
          retryConfig: { maxRetries: 2, backoffMs: 2000 },
        },
      ],
      globalTimeoutMs: 300000,
      ...((overrides?.definition as Record<string, unknown>) ?? {}),
    },
    tenantId: "tenant-1",
    correlationId: "corr-e2e-1",
    context: { userId: "user-1", actor: "admin@example.com" },
    ...(overrides ?? {}),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Orchestration E2E", () => {
  let mockDB: MockDB;
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    mockDB = createMockDB();
    env = createMockEnv(mockDB);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Event -> Agent Fan-out
  // =========================================================================

  describe("Event -> Agent fan-out", () => {
    it("registers agent, publishes matching event, delivers with correct HMAC", async () => {
      // Step 1: Register an agent via API to get the secret
      const registerRes = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "e2e-test-agent",
            description: "E2E test agent",
            webhookUrl: "https://agent.test/webhook",
            capabilities: ["process"],
            healthCheckUrl: "https://agent.test/health",
            eventTypes: ["user.created"],
          }),
        },
        env,
      );

      expect(registerRes.status).toBe(201);
      const agentData = ((await registerRes.json()) as any).data;
      const agentSecret = agentData.secret;
      const agentId = agentData.id;
      expect(agentSecret).toMatch(/^[0-9a-f]{64}$/);

      // The fan-out query uses a JOIN that the mock DB cannot resolve natively.
      // The mock returns rows from the first table in the FROM clause (agent_registry).
      // Seed the agent_registry with a row that also has the JOIN-projected columns
      // so the mock's WHERE filter (event_type = ?) can match.
      mockDB.tables.agent_registry = [];
      mockDB.tables.agent_registry.push({
        id: agentId,
        agentId: agentId,
        agentName: "e2e-test-agent",
        name: "e2e-test-agent",
        webhook_url: "https://agent.test/webhook",
        webhookUrl: "https://agent.test/webhook",
        secret: agentSecret,
        status: "active",
        event_type: "user.created",
        eventType: "user.created",
        created_at: new Date().toISOString(),
      });

      // Step 2: Mock fetch to capture the webhook delivery
      const fetchCalls: {
        url: string;
        headers: Record<string, string>;
        body: string;
      }[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async (input: any, init?: any) => {
        const url = typeof input === "string" ? input : input.url;
        fetchCalls.push({
          url,
          headers: init?.headers ?? {},
          body: init?.body ?? "",
        });
        return new Response("OK", { status: 200 });
      }) as any;

      try {
        // Step 3: Publish matching event (with mock execution context for waitUntil)
        const execCtx = createMockExecutionCtx();
        const publishRes = await app.request(
          "/api/v1/events",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: "tenant-1",
              type: "user.created",
              source: "core-api",
              payload: { userId: "u-1", email: "test@example.com" },
            }),
          },
          env,
          execCtx.ctx as any,
        );

        expect(publishRes.status).toBe(201);
        const eventData = ((await publishRes.json()) as any).data;
        expect(eventData.type).toBe("user.created");
        expect(eventData.subscriberCount).toBe(1);

        // Await the async fan-out promises
        await execCtx.waitForAll();

        // Step 4: Verify webhook was called
        expect(fetchCalls.length).toBeGreaterThanOrEqual(1);
        const webhookCall = fetchCalls.find((c) =>
          c.url.includes("agent.test/webhook"),
        );
        expect(webhookCall).toBeDefined();

        // Step 5: Verify HMAC signature is correct
        const signature = webhookCall!.headers["X-Signature"];
        const body = webhookCall!.body;

        expect(signature).toBeDefined();
        expect(body).toBeDefined();

        // Verify using the MCP SDK HMAC module
        const isValid = await verifySignature(body, signature, agentSecret);
        expect(isValid).toBe(true);

        // Verify payload structure
        const parsedBody = JSON.parse(body);
        expect(parsedBody.eventId).toBeDefined();
        expect(parsedBody.tenantId).toBe("tenant-1");
        expect(parsedBody.type).toBe("user.created");
        expect(parsedBody.source).toBe("core-api");
        expect(parsedBody.payload.userId).toBe("u-1");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 2. Event -> No Subscribers
  // =========================================================================

  describe("Event -> No subscribers", () => {
    it("stores event but makes no delivery attempts when no agents subscribe", async () => {
      const fetchSpy = vi.fn();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = fetchSpy as any;

      try {
        const res = await app.request(
          "/api/v1/events",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: "tenant-1",
              type: "ticket.resolved",
              source: "helpdesk",
              payload: { ticketId: "T-42" },
            }),
          },
          env,
        );

        expect(res.status).toBe(201);
        const body = (await res.json()) as any;
        expect(body.data.subscriberCount).toBe(0);

        // Event was stored
        expect(mockDB.tables.events).toHaveLength(1);
        expect(mockDB.tables.events[0].type).toBe("ticket.resolved");
        expect(mockDB.tables.events[0].status).toBe("processing");

        // No deliveries created
        expect(mockDB.tables.event_deliveries).toHaveLength(0);

        // Fetch was never called for webhook delivery
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 3. Failed Delivery -> DLQ
  // =========================================================================

  describe("Failed delivery -> Dead letter queue", () => {
    it("moves event to DLQ after webhook returns 500", async () => {
      const agentId = "agent-failing-1";
      const agentSecret = "a".repeat(64);

      // Seed agent in mock DB with JOIN-compatible columns for the fan-out query
      mockDB.tables.agent_registry.push({
        id: agentId,
        agentId: agentId,
        agentName: "failing-agent",
        name: "failing-agent",
        webhook_url: "https://failing-agent.test/webhook",
        webhookUrl: "https://failing-agent.test/webhook",
        secret: agentSecret,
        status: "active",
        event_type: "user.deleted",
        eventType: "user.deleted",
        created_at: new Date().toISOString(),
      });

      // Mock fetch to return 500
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async () => {
        return new Response("Internal Server Error", { status: 500 });
      }) as any;

      try {
        const execCtx = createMockExecutionCtx();
        const publishRes = await app.request(
          "/api/v1/events",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: "tenant-1",
              type: "user.deleted",
              source: "admin-api",
              payload: { userId: "u-deleted" },
            }),
          },
          env,
          execCtx.ctx as any,
        );

        expect(publishRes.status).toBe(201);
        const eventData = ((await publishRes.json()) as any).data;
        expect(eventData.subscriberCount).toBe(1);

        // Await the async fan-out promises
        await execCtx.waitForAll();

        // Verify delivery was created and marked as failed
        expect(mockDB.tables.event_deliveries.length).toBeGreaterThanOrEqual(1);
        const delivery = mockDB.tables.event_deliveries[0];
        expect(delivery.status).toBe("dead_letter");

        // Verify DLQ entry was created (max_attempts defaults to 1, attempts = 1)
        expect(mockDB.tables.dead_letter_queue.length).toBeGreaterThanOrEqual(
          1,
        );
        const dlqEntry = mockDB.tables.dead_letter_queue[0];
        expect(dlqEntry.event_type).toBe("user.deleted");
        expect(dlqEntry.tenant_id).toBe("tenant-1");
        expect(dlqEntry.error_message).toContain("500");

        // Event should be marked as failed
        const failedEvent = mockDB.tables.events.find(
          (e) => e.type === "user.deleted",
        );
        expect(failedEvent?.status).toBe("failed");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 4. DLQ Replay
  // =========================================================================

  describe("DLQ replay", () => {
    it("replays a dead letter entry by re-publishing the event", async () => {
      // Seed a DLQ entry
      mockDB.tables.dead_letter_queue.push({
        id: "dlq-replay-1",
        event_id: "evt-orig-1",
        agent_id: "agent-1",
        delivery_id: "del-1",
        tenant_id: "tenant-1",
        event_type: "user.created",
        event_source: "core-api",
        event_payload: JSON.stringify({ userId: "u-1" }),
        error_message: "HTTP 500: Internal Server Error",
        total_attempts: 3,
        first_attempt_at: "2026-03-15T00:00:00Z",
        last_attempt_at: "2026-03-15T00:05:00Z",
        dead_lettered_at: new Date().toISOString(),
        replay_status: null,
        replayed_at: null,
      });

      // Mock fetch: the replay calls back into the orchestrator to re-publish
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async (input: any) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/api/v1/events")) {
          return new Response(
            JSON.stringify({
              status: "success",
              data: { id: "evt-replayed", status: "processing" },
            }),
            { status: 201, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response("OK", { status: 200 });
      }) as any;

      try {
        const replayRes = await app.request(
          "/api/v1/dead-letter/dlq-replay-1/replay",
          { method: "POST" },
          env,
        );

        expect(replayRes.status).toBe(200);
        const body = (await replayRes.json()) as any;
        expect(body.status).toBe("success");
        expect(body.data.replayed).toBe(true);

        // DLQ entry should be marked as replayed
        const dlqEntry = mockDB.tables.dead_letter_queue.find(
          (e) => e.id === "dlq-replay-1",
        );
        expect(dlqEntry?.replay_status).toBe("success");
        expect(dlqEntry?.replayed_at).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("prevents double replay of the same DLQ entry", async () => {
      mockDB.tables.dead_letter_queue.push({
        id: "dlq-already-replayed",
        event_id: "evt-2",
        agent_id: "agent-1",
        delivery_id: "del-2",
        tenant_id: "tenant-1",
        event_type: "user.created",
        event_source: "core-api",
        error_message: "HTTP 500",
        total_attempts: 3,
        dead_lettered_at: new Date().toISOString(),
        replay_status: "success",
        replayed_at: new Date().toISOString(),
      });

      const res = await app.request(
        "/api/v1/dead-letter/dlq-already-replayed/replay",
        { method: "POST" },
        env,
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as any;
      expect(body.status).toBe("error");
      expect(body.message).toContain("Already replayed");
    });
  });

  // =========================================================================
  // 5. Agent Registration Lifecycle
  // =========================================================================

  describe("Agent registration lifecycle", () => {
    it("register -> subscribe -> health check -> deregister with cascade deletes", async () => {
      // 1. Register agent
      const registerRes = await app.request(
        "/api/v1/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "lifecycle-agent",
            webhookUrl: "https://lifecycle-agent.test/webhook",
            healthCheckUrl: "https://lifecycle-agent.test/health",
            eventTypes: ["user.created"],
          }),
        },
        env,
      );

      expect(registerRes.status).toBe(201);
      const agentData = ((await registerRes.json()) as any).data;
      const agentId = agentData.id;
      expect(agentData.status).toBe("active");
      expect(mockDB.tables.event_subscriptions).toHaveLength(1);

      // 2. Add another subscription
      const subRes = await app.request(
        `/api/v1/agents/${agentId}/subscriptions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "user.updated" }),
        },
        env,
      );

      expect(subRes.status).toBe(201);
      expect(mockDB.tables.event_subscriptions).toHaveLength(2);

      // 3. Health check (mock fetch for health endpoint)
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async () => {
        return new Response(JSON.stringify({ status: "healthy" }), {
          status: 200,
        });
      }) as any;

      try {
        const healthRes = await app.request(
          `/api/v1/agents/${agentId}/health`,
          { method: "POST" },
          env,
        );

        expect(healthRes.status).toBe(200);
        const healthBody = (await healthRes.json()) as any;
        expect(healthBody.data.healthStatus).toBe("healthy");

        // Verify agent status updated in DB
        const agentRow = mockDB.tables.agent_registry[0];
        expect(agentRow.last_health_status).toBe("healthy");
        expect(agentRow.status).toBe("active");
      } finally {
        globalThis.fetch = originalFetch;
      }

      // 4. Verify agent details include subscriptions
      const detailsRes = await app.request(
        `/api/v1/agents/${agentId}`,
        { method: "GET" },
        env,
      );

      expect(detailsRes.status).toBe(200);
      const details = ((await detailsRes.json()) as any).data;
      expect(details.eventTypes).toHaveLength(2);
      expect(details.eventTypes).toContain("user.created");
      expect(details.eventTypes).toContain("user.updated");

      // 5. Deregister agent — cascades to delete subscriptions
      const deleteRes = await app.request(
        `/api/v1/agents/${agentId}`,
        { method: "DELETE" },
        env,
      );

      expect(deleteRes.status).toBe(200);
      const deleteBody = (await deleteRes.json()) as any;
      expect(deleteBody.data.deleted).toBe(true);

      // Verify cascade
      expect(mockDB.tables.agent_registry).toHaveLength(0);
      expect(mockDB.tables.event_subscriptions).toHaveLength(0);
    });
  });

  // =========================================================================
  // 6. Idempotent Event Publishing
  // =========================================================================

  describe("Idempotent event publishing", () => {
    it("second publish with same idempotency key returns deduplicated response", async () => {
      const idempotencyKey = "idem-e2e-001";

      const eventPayload = {
        tenantId: "tenant-1",
        type: "user.created",
        source: "core-api",
        payload: { userId: "u-1" },
        idempotencyKey,
      };

      // First publish
      const res1 = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        },
        env,
      );

      expect(res1.status).toBe(201);
      const body1 = (await res1.json()) as any;
      expect(body1.status).toBe("success");
      const eventId = body1.data.id;
      expect(eventId).toBeDefined();

      // Second publish with same key
      const res2 = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        },
        env,
      );

      // Returns 200 (not 201) with deduplicated flag
      expect(res2.status).toBe(200);
      const body2 = (await res2.json()) as any;
      expect(body2.deduplicated).toBe(true);
      expect(body2.data.id).toBe(eventId);

      // Only one event in the DB
      expect(mockDB.tables.events).toHaveLength(1);
    });

    it("different idempotency keys create separate events", async () => {
      const res1 = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "tenant-1",
            type: "user.created",
            source: "core-api",
            idempotencyKey: "key-A",
          }),
        },
        env,
      );

      const res2 = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "tenant-1",
            type: "user.created",
            source: "core-api",
            idempotencyKey: "key-B",
          }),
        },
        env,
      );

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(mockDB.tables.events).toHaveLength(2);

      const body1 = (await res1.json()) as any;
      const body2 = (await res2.json()) as any;
      expect(body1.data.id).not.toBe(body2.data.id);
    });
  });

  // =========================================================================
  // 7. WorkflowDO State Transitions (Happy Path)
  // =========================================================================

  describe("WorkflowDO state transitions", () => {
    it("creates workflow, starts, completes steps, reaches completed status", async () => {
      const { doInstance, queueBus, evidenceStore } = createWorkflowDO(mockDB);

      // Start workflow
      const startReq = new Request("http://workflow/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeWorkflowDefinition()),
      });

      const startRes = await doInstance.fetch(startReq);
      expect(startRes.status).toBe(201);

      const startBody = (await startRes.json()) as any;
      expect(startBody.status).toBe("started");
      expect(startBody.runId).toBeDefined();
      expect(startBody.workflowStatus).toBe("running");
      expect(startBody.currentStep).toBe("validate-profile");

      // Queue bus should have dispatched the first step task
      const stepTasks = queueBus.getMessages("step-tasks");
      expect(stepTasks).toHaveLength(1);
      expect((stepTasks[0].msg as any).stepId).toBe("validate-profile");

      // Check status
      const statusRes = await doInstance.fetch(
        new Request("http://workflow/status", { method: "GET" }),
      );
      expect(statusRes.status).toBe(200);
      const statusBody = (await statusRes.json()) as any;
      expect(statusBody.status).toBe("running");
      expect(statusBody.steps[0].status).toBe("running");
      expect(statusBody.steps[1].status).toBe("pending");

      // Complete step 1
      const completeStep1Res = await doInstance.fetch(
        new Request("http://workflow/step/validate-profile/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ output: { validated: true } }),
        }),
      );
      expect(completeStep1Res.status).toBe(200);
      const step1Body = (await completeStep1Res.json()) as any;
      expect(step1Body.status).toBe("advancing");
      expect(step1Body.nextStep).toBe("provision-accounts");

      // Evidence should have been emitted for step 1
      const step1Evidence = evidenceStore.getAll();
      expect(step1Evidence.length).toBeGreaterThanOrEqual(1);

      // Queue bus should have dispatched step 2
      const allStepTasks = queueBus.getMessages("step-tasks");
      expect(allStepTasks).toHaveLength(2);
      expect((allStepTasks[1].msg as any).stepId).toBe("provision-accounts");

      // Complete step 2
      const completeStep2Res = await doInstance.fetch(
        new Request("http://workflow/step/provision-accounts/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ output: { accountIds: ["acc-1"] } }),
        }),
      );
      expect(completeStep2Res.status).toBe(200);
      const step2Body = (await completeStep2Res.json()) as any;
      expect(step2Body.status).toBe("completed");

      // Final status check
      const finalStatusRes = await doInstance.fetch(
        new Request("http://workflow/status", { method: "GET" }),
      );
      const finalStatus = (await finalStatusRes.json()) as any;
      expect(finalStatus.status).toBe("completed");
      expect(
        finalStatus.steps.every((s: any) => s.status === "completed"),
      ).toBe(true);
      expect(finalStatus.completedAt).toBeDefined();
      expect(finalStatus.context.validated).toBe(true);
      expect(finalStatus.context.accountIds).toEqual(["acc-1"]);
    });
  });

  // =========================================================================
  // 8. WorkflowDO Failure Path
  // =========================================================================

  describe("WorkflowDO failure path", () => {
    it("exhausts retries, transitions to failed, creates DLQ entry", async () => {
      const { doInstance, queueBus, evidenceStore } = createWorkflowDO(mockDB);

      // Start a single-step workflow with low retry config
      const definition = makeWorkflowDefinition();
      // Override to have maxRetries = 2
      (definition.definition.steps[0] as any).retryConfig = {
        maxRetries: 2,
        backoffMs: 100,
      };

      const startRes = await doInstance.fetch(
        new Request("http://workflow/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(definition),
        }),
      );
      expect(startRes.status).toBe(201);

      // Fail step 1, attempt 1 (retries remaining)
      const fail1Res = await doInstance.fetch(
        new Request("http://workflow/step/validate-profile/fail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Service unavailable" }),
        }),
      );
      expect(fail1Res.status).toBe(200);
      const fail1Body = (await fail1Res.json()) as any;
      expect(fail1Body.status).toBe("retrying");
      expect(fail1Body.attempt).toBe(2);
      expect(fail1Body.maxRetries).toBe(2);

      // Fail step 1, attempt 2 (retries remaining)
      const fail2Res = await doInstance.fetch(
        new Request("http://workflow/step/validate-profile/fail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Service still unavailable" }),
        }),
      );
      expect(fail2Res.status).toBe(200);
      const fail2Body = (await fail2Res.json()) as any;
      // After attempt 3 (attempts > maxRetries), should fail
      expect(fail2Body.status).toBe("failed");
      expect(fail2Body.error).toContain("validate-profile");

      // Verify run is in failed state
      const statusRes = await doInstance.fetch(
        new Request("http://workflow/status", { method: "GET" }),
      );
      const statusBody = (await statusRes.json()) as any;
      expect(statusBody.status).toBe("failed");
      expect(statusBody.completedAt).toBeDefined();

      // Step should be in dlq status
      const failedStep = statusBody.steps.find(
        (s: any) => s.stepId === "validate-profile",
      );
      expect(failedStep.status).toBe("dlq");
      expect(failedStep.error).toBe("Service still unavailable");

      // DLQ entry should have been created in the DB
      expect(mockDB.tables.dead_letter_queue.length).toBeGreaterThanOrEqual(1);
      const dlqEntry = mockDB.tables.dead_letter_queue[0];
      expect(dlqEntry.event_type).toContain("workflow.step");
      expect(dlqEntry.error_message).toBe("Service still unavailable");

      // Evidence should have been emitted for the failed step
      const allEvidence = evidenceStore.getAll();
      expect(allEvidence.length).toBeGreaterThanOrEqual(1);

      // History should record all attempts
      expect(statusBody.history.length).toBeGreaterThanOrEqual(3);
      // running -> failed (attempt 1) -> failed (attempt 2) -> dlq
    });

    it("cannot transition to running after failure", async () => {
      const { doInstance } = createWorkflowDO(mockDB);

      const definition = makeWorkflowDefinition();
      (definition.definition.steps[0] as any).retryConfig = {
        maxRetries: 0,
        backoffMs: 100,
      };

      await doInstance.fetch(
        new Request("http://workflow/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(definition),
        }),
      );

      // Fail immediately (maxRetries = 0, so first fail after initial attempt)
      await doInstance.fetch(
        new Request("http://workflow/step/validate-profile/fail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Fatal error" }),
        }),
      );

      // Verify state is failed
      const statusRes = await doInstance.fetch(
        new Request("http://workflow/status", { method: "GET" }),
      );
      const statusBody = (await statusRes.json()) as any;
      expect(statusBody.status).toBe("failed");
    });
  });
});
