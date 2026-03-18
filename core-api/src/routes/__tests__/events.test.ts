import { describe, it, expect } from "vitest";
import { app } from "../../index";

type EventRow = Record<string, unknown>;

function createMockDB() {
  const events: EventRow[] = [];

  return {
    events,
    db: {
      prepare: (sql: string) => ({
        bind: (...params: unknown[]) => ({
          first: async <T = EventRow>(): Promise<T | null> => {
            if (sql.includes("idempotency_key")) {
              const key = params[0] as string;
              return (
                (events.find((e) => e.idempotency_key === key) as T) ?? null
              );
            }
            if (sql.includes("SELECT") && sql.includes("WHERE id")) {
              const id = params[0] as string;
              return (events.find((e) => e.id === id) as T) ?? null;
            }
            return null;
          },
          all: async () => ({
            results: events,
          }),
          run: async () => {
            if (sql.includes("INSERT INTO events")) {
              const event: EventRow = {
                id: params[0] as string,
                tenant_id: params[1] as string,
                type: params[2] as string,
                source: params[3] as string,
                payload: params[4],
                status: params[5] as string,
                idempotency_key: params[6],
                created_at: new Date().toISOString(),
              };
              events.push(event);
            }
            return { success: true };
          },
        }),
        first: async () => null,
        all: async () => ({ results: events }),
        run: async () => ({ success: true }),
      }),
    },
  };
}

function createMockEnv(dbMock: ReturnType<typeof createMockDB>["db"]) {
  return {
    DB: dbMock,
    KV_SESSIONS: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    KV_CACHE: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    KV_FEATURE_FLAGS: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
  };
}

describe("Event Routes", () => {
  describe("POST /api/v1/events", () => {
    it("should create an event with valid data", async () => {
      const mock = createMockDB();
      const env = createMockEnv(mock.db);

      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "550e8400-e29b-41d4-a716-446655440000",
            type: "user.created",
            source: "auth-service",
            payload: { userId: "u-123" },
          }),
        },
        env,
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.id).toBeDefined();
      expect(body.data.type).toBe("user.created");
      expect(body.data.source).toBe("auth-service");
      expect(body.data.status).toBe("pending");
      expect(mock.events.length).toBe(1);
    });

    it("should return 400 for invalid body", async () => {
      const mock = createMockDB();
      const env = createMockEnv(mock.db);

      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "not-a-uuid",
            type: "",
          }),
        },
        env,
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("VALIDATION_FAILED");
      expect(body.message).toBe("Invalid event payload");
    });

    it("should deduplicate with idempotencyKey", async () => {
      const mock = createMockDB();
      const env = createMockEnv(mock.db);
      const eventPayload = {
        tenantId: "550e8400-e29b-41d4-a716-446655440000",
        type: "user.updated",
        source: "user-service",
        idempotencyKey: "idem-key-1",
      };

      // First request creates the event
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

      // Second request with same idempotency key returns existing event
      const res2 = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        },
        env,
      );
      expect(res2.status).toBe(200);
      const body2 = await res2.json();
      expect(body2.status).toBe("success");
      expect(body2.data.deduplicated).toBe(true);
      expect(mock.events.length).toBe(1);
    });
  });

  describe("GET /api/v1/events", () => {
    it("should list events", async () => {
      const mock = createMockDB();
      mock.events.push(
        {
          id: "evt-1",
          tenant_id: "t1",
          type: "user.created",
          source: "auth",
          status: "pending",
          created_at: new Date().toISOString(),
        },
        {
          id: "evt-2",
          tenant_id: "t1",
          type: "user.updated",
          source: "auth",
          status: "processed",
          created_at: new Date().toISOString(),
        },
      );
      const env = createMockEnv(mock.db);

      const res = await app.request("/api/v1/events", {}, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(2);
      expect(body.meta).toBeDefined();
      expect(body.meta.limit).toBeDefined();
      expect(body.meta.offset).toBeDefined();
    });
  });

  describe("GET /api/v1/events/:id", () => {
    it("should return an event by ID", async () => {
      const mock = createMockDB();
      mock.events.push({
        id: "evt-find-me",
        tenant_id: "t1",
        type: "compliance.check",
        source: "compliance-worker",
        status: "processed",
        created_at: new Date().toISOString(),
      });
      const env = createMockEnv(mock.db);

      const res = await app.request("/api/v1/events/evt-find-me", {}, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.type).toBe("compliance.check");
    });

    it("should return 404 for missing event", async () => {
      const mock = createMockDB();
      const env = createMockEnv(mock.db);

      const res = await app.request("/api/v1/events/nonexistent", {}, env);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("NOT_FOUND");
      expect(body.message).toBe("Event not found");
    });
  });

  describe("RBAC enforcement", () => {
    function createApiKeyEnv() {
      const { db } = createMockDB();
      return {
        DB: db,
        KV_SESSIONS: {
          get: async () => null,
          put: async () => {},
          delete: async () => {},
        },
        KV_CACHE: {
          get: async () => null,
          put: async () => {},
          delete: async () => {},
        },
        KV_FEATURE_FLAGS: {
          get: async () => null,
          put: async () => {},
          delete: async () => {},
        },
        API_ALLOWED_KEYS: "test-key",
      };
    }

    it("should return 403 for POST /api/v1/events with insufficient role", async () => {
      const env = createApiKeyEnv();
      const res = await app.request(
        "/api/v1/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test-key",
          },
          body: JSON.stringify({
            tenantId: "550e8400-e29b-41d4-a716-446655440000",
            type: "test.event",
            source: "test",
          }),
        },
        env,
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("FORBIDDEN");
    });
  });
});
