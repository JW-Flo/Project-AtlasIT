import { describe, it, expect, beforeEach } from "vitest";
import app from "../../index";

type TenantRow = Record<string, unknown>;

function createMockDB() {
  const tenants: TenantRow[] = [];

  return {
    tenants,
    db: {
      prepare: (sql: string) => ({
        bind: (...params: unknown[]) => ({
          first: async <T = TenantRow>(): Promise<T | null> => {
            if (sql.includes("COUNT(*)")) {
              return { total: tenants.length } as unknown as T;
            }
            if (sql.includes("SELECT") && sql.includes("WHERE id")) {
              const id = params[0] as string;
              return (tenants.find((t) => t.id === id) as T) ?? null;
            }
            return null;
          },
          all: async () => ({
            results: tenants,
          }),
          run: async () => {
            if (sql.includes("INSERT INTO tenants")) {
              const slug = params[2] as string;
              if (tenants.some((t) => t.slug === slug)) {
                throw new Error("UNIQUE constraint failed: tenants.slug");
              }
              const tenant: TenantRow = {
                id: params[0] as string,
                name: params[1] as string,
                slug,
                industry: params[3],
                tier: params[4],
                status: params[5],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              tenants.push(tenant);
            }
            if (sql.includes("UPDATE tenants")) {
              const id = params[params.length - 1] as string;
              const idx = tenants.findIndex((t) => t.id === id);
              if (idx !== -1) {
                tenants[idx] = {
                  ...tenants[idx],
                  updated_at: new Date().toISOString(),
                };
              }
            }
            if (sql.includes("DELETE FROM tenants")) {
              const id = params[0] as string;
              const idx = tenants.findIndex((t) => t.id === id);
              if (idx !== -1) tenants.splice(idx, 1);
            }
            return { success: true };
          },
        }),
        first: async <T = TenantRow>(): Promise<T | null> => {
          if (sql.includes("COUNT(*)")) {
            return { total: tenants.length } as unknown as T;
          }
          return null;
        },
        all: async () => ({ results: tenants }),
        run: async () => ({ success: true }),
      }),
    },
  };
}

function createMockEnv(dbOverride?: ReturnType<typeof createMockDB>["db"]) {
  const { db, tenants } = dbOverride
    ? { db: dbOverride, tenants: [] }
    : createMockDB();
  return {
    env: {
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
    },
    tenants,
  };
}

describe("Tenant Routes", () => {
  describe("POST /api/v1/tenants", () => {
    it("should create a tenant with valid data", async () => {
      const mock = createMockDB();
      const env = {
        DB: mock.db,
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

      const res = await app.request(
        "/api/v1/tenants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Acme Corp",
            slug: "acme-corp",
            industry: "Technology",
            tier: "starter",
          }),
        },
        env,
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data).toBeDefined();
      expect(mock.tenants.length).toBe(1);
      expect(mock.tenants[0].name).toBe("Acme Corp");
      expect(mock.tenants[0].slug).toBe("acme-corp");
    });

    it("should return 400 for invalid body", async () => {
      const { env } = createMockEnv();
      const res = await app.request(
        "/api/v1/tenants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",
            slug: "X",
          }),
        },
        env,
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("VALIDATION_FAILED");
    });

    it("should return 409 for duplicate slug", async () => {
      const mock = createMockDB();
      const env = {
        DB: mock.db,
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

      // Create first tenant
      await app.request(
        "/api/v1/tenants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "First Corp",
            slug: "dup-slug",
          }),
        },
        env,
      );

      // Attempt duplicate
      const res = await app.request(
        "/api/v1/tenants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Second Corp",
            slug: "dup-slug",
          }),
        },
        env,
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("CONFLICT");
    });
  });

  describe("GET /api/v1/tenants", () => {
    it("should list tenants", async () => {
      const mock = createMockDB();
      mock.tenants.push(
        {
          id: "t1",
          name: "Tenant 1",
          slug: "tenant-1",
          status: "active",
          tier: "free",
        },
        {
          id: "t2",
          name: "Tenant 2",
          slug: "tenant-2",
          status: "active",
          tier: "starter",
        },
      );
      const env = {
        DB: mock.db,
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

      const res = await app.request("/api/v1/tenants", {}, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(2);
      expect(body.meta).toBeDefined();
      expect(body.meta.total).toBe(2);
    });
  });

  describe("GET /api/v1/tenants/:id", () => {
    it("should return a tenant by ID", async () => {
      const mock = createMockDB();
      mock.tenants.push({
        id: "tenant-123",
        name: "Found Tenant",
        slug: "found-tenant",
        status: "active",
        tier: "professional",
      });
      const env = {
        DB: mock.db,
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

      const res = await app.request("/api/v1/tenants/tenant-123", {}, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.name).toBe("Found Tenant");
    });

    it("should return 404 for missing tenant", async () => {
      const mock = createMockDB();
      const env = {
        DB: mock.db,
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

      const res = await app.request("/api/v1/tenants/nonexistent", {}, env);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.code).toBe("NOT_FOUND");
      expect(body.message).toBe("Tenant not found");
    });
  });

  describe("PATCH /api/v1/tenants/:id", () => {
    it("should update a tenant", async () => {
      const mock = createMockDB();
      mock.tenants.push({
        id: "update-me",
        name: "Old Name",
        slug: "old-slug",
        status: "active",
        tier: "free",
      });
      const env = {
        DB: mock.db,
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

      const res = await app.request(
        "/api/v1/tenants/update-me",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "New Name" }),
        },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data).toBeDefined();
    });

    it("should return 404 when updating nonexistent tenant", async () => {
      const mock = createMockDB();
      const env = {
        DB: mock.db,
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

      const res = await app.request(
        "/api/v1/tenants/nonexistent",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Update" }),
        },
        env,
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /api/v1/tenants/:id", () => {
    it("should delete a tenant", async () => {
      const mock = createMockDB();
      mock.tenants.push({
        id: "delete-me",
        name: "Doomed",
        slug: "doomed",
        status: "active",
        tier: "free",
      });
      const env = {
        DB: mock.db,
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

      const res = await app.request(
        "/api/v1/tenants/delete-me",
        { method: "DELETE" },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.deleted).toBe(true);
      expect(mock.tenants.length).toBe(0);
    });

    it("should return 404 when deleting nonexistent tenant", async () => {
      const mock = createMockDB();
      const env = {
        DB: mock.db,
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

      const res = await app.request(
        "/api/v1/tenants/ghost",
        { method: "DELETE" },
        env,
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe("NOT_FOUND");
    });
  });

  describe("RBAC enforcement", () => {
    // API-key auth assigns roles: ["api-key"], which is not in the
    // viewer < member < admin hierarchy, so all requireRole checks fail.
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

    it("should return 403 for POST /api/v1/tenants with insufficient role", async () => {
      const env = createApiKeyEnv();
      const res = await app.request(
        "/api/v1/tenants",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test-key",
          },
          body: JSON.stringify({ name: "Test", slug: "test-co" }),
        },
        env,
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("FORBIDDEN");
    });

    it("should return 403 for PATCH /api/v1/tenants/:id with insufficient role", async () => {
      const env = createApiKeyEnv();
      const res = await app.request(
        "/api/v1/tenants/some-id",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test-key",
          },
          body: JSON.stringify({ name: "Updated" }),
        },
        env,
      );
      expect(res.status).toBe(403);
    });

    it("should return 403 for DELETE /api/v1/tenants/:id with insufficient role", async () => {
      const env = createApiKeyEnv();
      const res = await app.request(
        "/api/v1/tenants/some-id",
        {
          method: "DELETE",
          headers: { "X-API-Key": "test-key" },
        },
        env,
      );
      expect(res.status).toBe(403);
    });
  });
});
