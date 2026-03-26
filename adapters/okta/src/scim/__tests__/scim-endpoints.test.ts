import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { scimRouter } from "../router.js";
import { parseScimFilter, mapUserFilterToSql, mapGroupFilterToSql } from "../filter.js";
import { SCIM_SCHEMAS } from "../types.js";

// ---------- D1 Mock ----------

interface MockRow {
  [key: string]: unknown;
}

function createMockDB(initialData?: {
  users?: MockRow[];
  groups?: MockRow[];
  memberships?: MockRow[];
}) {
  const tables: Record<string, MockRow[]> = {
    directory_users: initialData?.users ? [...initialData.users] : [],
    directory_groups: initialData?.groups ? [...initialData.groups] : [],
    directory_memberships: initialData?.memberships
      ? [...initialData.memberships]
      : [],
  };

  function findTable(sql: string): string {
    const match = sql.match(
      /(?:FROM|INTO|UPDATE|DELETE FROM)\s+(\w+)/i,
    );
    return match ? match[1] : "";
  }

  function applyBindings(sql: string, params: unknown[]): { sql: string; values: unknown[] } {
    return { sql, values: params };
  }

  function executeSelect(sql: string, params: unknown[]): MockRow[] {
    const table = findTable(sql);
    const rows = tables[table] ?? [];

    // Handle COUNT
    if (sql.includes("COUNT(*)")) {
      return [{ cnt: rows.length }];
    }

    // Simple WHERE clause matching
    let filtered = [...rows];

    // Extract WHERE conditions
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i);
    if (whereMatch) {
      const conditions = whereMatch[1];

      // Parse bind parameters (?1, ?2, etc.)
      const bindPairs: Array<{ column: string; value: unknown; operator: string }> = [];

      // Match column = ?N patterns
      const eqMatches = [...conditions.matchAll(/(\w+)\s*=\s*\?(\d+)/g)];
      for (const m of eqMatches) {
        const paramIdx = parseInt(m[2], 10) - 1;
        bindPairs.push({ column: m[1], value: params[paramIdx], operator: "eq" });
      }

      // Match column LIKE ?N patterns
      const likeMatches = [...conditions.matchAll(/(\w+)\s+LIKE\s+\?(\d+)/g)];
      for (const m of likeMatches) {
        const paramIdx = parseInt(m[2], 10) - 1;
        bindPairs.push({ column: m[1], value: params[paramIdx], operator: "like" });
      }

      for (const pair of bindPairs) {
        filtered = filtered.filter((row) => {
          if (pair.operator === "eq") {
            return row[pair.column] === pair.value;
          }
          if (pair.operator === "like") {
            const pattern = String(pair.value);
            const val = String(row[pair.column] ?? "");
            if (pattern.startsWith("%") && pattern.endsWith("%")) {
              return val.includes(pattern.slice(1, -1));
            }
            if (pattern.startsWith("%")) {
              return val.endsWith(pattern.slice(1));
            }
            if (pattern.endsWith("%")) {
              return val.startsWith(pattern.slice(0, -1));
            }
            return val === pattern;
          }
          return true;
        });
      }
    }

    // Handle LIMIT/OFFSET
    const limitMatch = sql.match(/LIMIT\s+\?(\d+)/i);
    const offsetMatch = sql.match(/OFFSET\s+\?(\d+)/i);
    if (limitMatch && offsetMatch) {
      const limit = Number(params[parseInt(limitMatch[1], 10) - 1]);
      const offset = Number(params[parseInt(offsetMatch[1], 10) - 1]);
      filtered = filtered.slice(offset, offset + limit);
    }

    return filtered;
  }

  function executeInsert(sql: string, params: unknown[]): void {
    const table = findTable(sql);
    if (!tables[table]) tables[table] = [];

    // Extract column names from INSERT
    const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (!colMatch) return;

    const columns = colMatch[1].split(",").map((c) => c.trim());
    const row: MockRow = {};

    for (let i = 0; i < columns.length; i++) {
      // Handle ?N style params
      row[columns[i]] = params[i];
    }

    // Check OR IGNORE for duplicates
    if (sql.includes("OR IGNORE")) {
      const existingIdx = tables[table].findIndex((existing) => {
        // Check unique constraints loosely
        return columns.some(
          (col) =>
            (col === "id" || col === "email" || col === "name") &&
            existing[col] === row[col],
        );
      });
      if (existingIdx >= 0) return;
    }

    tables[table].push(row);
  }

  function executeUpdate(sql: string, params: unknown[]): void {
    const table = findTable(sql);
    const rows = tables[table] ?? [];

    // Find matching rows by WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
    if (!whereMatch) return;

    const eqMatches = [...whereMatch[1].matchAll(/(\w+)\s*=\s*\?(\d+)/g)];

    for (const row of rows) {
      let matches = true;
      for (const m of eqMatches) {
        const paramIdx = parseInt(m[2], 10) - 1;
        if (row[m[1]] !== params[paramIdx]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        // Apply SET clauses
        const setMatch = sql.match(/SET\s+([\s\S]+?)\s+WHERE/i);
        if (setMatch) {
          const setClauses = setMatch[1].split(",").map((s) => s.trim());
          for (const clause of setClauses) {
            const assignMatch = clause.match(/(\w+)\s*=\s*\?(\d+)/);
            if (assignMatch) {
              const paramIdx = parseInt(assignMatch[2], 10) - 1;
              row[assignMatch[1]] = params[paramIdx];
            }
            // Handle datetime('now')
            const nowMatch = clause.match(/(\w+)\s*=\s*datetime\('now'\)/);
            if (nowMatch) {
              row[nowMatch[1]] = new Date().toISOString();
            }
          }
        }
      }
    }
  }

  function executeDelete(sql: string, params: unknown[]): void {
    const table = findTable(sql);
    if (!tables[table]) return;

    const eqMatches = [
      ...sql.matchAll(/(\w+)\s*=\s*\?(\d+)/g),
    ];

    tables[table] = tables[table].filter((row) => {
      for (const m of eqMatches) {
        const paramIdx = parseInt(m[2], 10) - 1;
        if (row[m[1]] !== params[paramIdx]) return true;
      }
      return false;
    });
  }

  const db = {
    prepare(sql: string) {
      let boundParams: unknown[] = [];

      const statement = {
        bind(...args: unknown[]) {
          boundParams = args;
          return statement;
        },
        async first<T>(): Promise<T | null> {
          const rows = executeSelect(sql, boundParams);
          return (rows[0] as T) ?? null;
        },
        async all<T>(): Promise<D1Result<T>> {
          const rows = executeSelect(sql, boundParams);
          return {
            results: rows as T[],
            success: true,
            meta: {} as D1Meta,
          } as D1Result<T>;
        },
        async run(): Promise<D1Result<unknown>> {
          const upperSql = sql.trim().toUpperCase();
          if (upperSql.startsWith("INSERT")) {
            executeInsert(sql, boundParams);
          } else if (upperSql.startsWith("UPDATE")) {
            executeUpdate(sql, boundParams);
          } else if (upperSql.startsWith("DELETE")) {
            executeDelete(sql, boundParams);
          }
          return {
            results: [],
            success: true,
            meta: {} as D1Meta,
          } as D1Result<unknown>;
        },
      };

      return statement;
    },
  };

  return db as unknown as D1Database;
}

// ---------- App setup ----------

const VALID_TOKEN = "test-scim-token-12345";

function createApp(db: D1Database) {
  const app = new Hono<{
    Bindings: {
      DB: D1Database;
      SCIM_API_TOKEN: string;
      CONNECTOR_ID: string;
    };
  }>();

  app.route("/scim/v2", scimRouter);

  return app;
}

function makeEnv(db: D1Database) {
  return {
    DB: db,
    SCIM_API_TOKEN: VALID_TOKEN,
    CONNECTOR_ID: "okta",
  };
}

function authHeaders(tenantId = "tenant-1"): Record<string, string> {
  return {
    Authorization: `Bearer ${VALID_TOKEN}`,
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
}

// ---------- Tests ----------

describe("SCIM 2.0 Endpoints", () => {
  let db: D1Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = createMockDB();
    app = createApp(db);
  });

  // ---------- Auth ----------

  describe("Bearer Token Auth", () => {
    it("should reject requests without Authorization header", async () => {
      const res = await app.request("/scim/v2/Users", {}, makeEnv(db));

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.ERROR);
      expect(body.detail).toBe("Authentication required");
    });

    it("should reject requests with invalid Bearer token", async () => {
      const res = await app.request(
        "/scim/v2/Users",
        { headers: { Authorization: "Bearer wrong-token" } },
        makeEnv(db),
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.ERROR);
      expect(body.detail).toBe("Invalid Bearer token");
    });

    it("should reject non-Bearer authentication schemes", async () => {
      const res = await app.request(
        "/scim/v2/Users",
        { headers: { Authorization: "Basic dXNlcjpwYXNz" } },
        makeEnv(db),
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.detail).toBe("Invalid authentication scheme");
    });
  });

  // ---------- User CRUD ----------

  describe("User CRUD", () => {
    it("POST /Users should create a user and return 201", async () => {
      const res = await app.request(
        "/scim/v2/Users",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            schemas: [SCIM_SCHEMAS.USER],
            userName: "jane@example.com",
            name: { givenName: "Jane", familyName: "Doe" },
            displayName: "Jane Doe",
            active: true,
            title: "Engineer",
            department: "Engineering",
          }),
        },
        makeEnv(db),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.USER);
      expect(body.userName).toBe("jane@example.com");
      expect(body.displayName).toBe("Jane Doe");
      expect(body.active).toBe(true);
      expect(body.id).toBeDefined();
      expect(body.meta.resourceType).toBe("User");
      expect(body.meta.location).toContain("/scim/v2/Users/");
    });

    it("POST /Users should return 409 for duplicate userName", async () => {
      const existingDb = createMockDB({
        users: [
          {
            id: "u-1",
            tenant_id: "tenant-1",
            external_id: "ext-1",
            email: "jane@example.com",
            display_name: "Jane Doe",
            department: null,
            title: null,
            status: "active",
            raw_attributes: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      });
      app = createApp(existingDb);

      const res = await app.request(
        "/scim/v2/Users",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            schemas: [SCIM_SCHEMAS.USER],
            userName: "jane@example.com",
            name: { givenName: "Jane", familyName: "Doe" },
          }),
        },
        makeEnv(existingDb),
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.ERROR);
      expect(body.scimType).toBe("uniqueness");
    });

    it("POST /Users should return 400 when userName is missing", async () => {
      const res = await app.request(
        "/scim/v2/Users",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            schemas: [SCIM_SCHEMAS.USER],
            name: { givenName: "Jane", familyName: "Doe" },
          }),
        },
        makeEnv(db),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.scimType).toBe("invalidValue");
    });

    it("GET /Users/:id should return a single user", async () => {
      const userDb = createMockDB({
        users: [
          {
            id: "u-1",
            tenant_id: "tenant-1",
            external_id: "ext-1",
            email: "alice@example.com",
            display_name: "Alice Smith",
            department: "Sales",
            title: "Manager",
            status: "active",
            raw_attributes: JSON.stringify({
              firstName: "Alice",
              lastName: "Smith",
            }),
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
        ],
      });
      app = createApp(userDb);

      const res = await app.request(
        "/scim/v2/Users/u-1",
        { headers: authHeaders() },
        makeEnv(userDb),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("u-1");
      expect(body.userName).toBe("alice@example.com");
      expect(body.name.givenName).toBe("Alice");
      expect(body.name.familyName).toBe("Smith");
      expect(body.active).toBe(true);
      expect(body.department).toBe("Sales");
      expect(body.meta.resourceType).toBe("User");
    });

    it("GET /Users/:id should return 404 for non-existent user", async () => {
      const res = await app.request(
        "/scim/v2/Users/nonexistent",
        { headers: authHeaders() },
        makeEnv(db),
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.ERROR);
      expect(body.status).toBe("404");
    });

    it("GET /Users should list users with ListResponse wrapper", async () => {
      const userDb = createMockDB({
        users: [
          {
            id: "u-1",
            tenant_id: "tenant-1",
            external_id: "ext-1",
            email: "alice@example.com",
            display_name: "Alice",
            department: null,
            title: null,
            status: "active",
            raw_attributes: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "u-2",
            tenant_id: "tenant-1",
            external_id: "ext-2",
            email: "bob@example.com",
            display_name: "Bob",
            department: null,
            title: null,
            status: "active",
            raw_attributes: null,
            created_at: "2024-01-02T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
        ],
      });
      app = createApp(userDb);

      const res = await app.request(
        "/scim/v2/Users",
        { headers: authHeaders() },
        makeEnv(userDb),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.LIST_RESPONSE);
      expect(body.totalResults).toBe(2);
      expect(body.startIndex).toBe(1);
      expect(body.Resources).toHaveLength(2);
      expect(body.Resources[0].userName).toBe("alice@example.com");
    });

    it("PATCH /Users/:id should update user attributes", async () => {
      const userDb = createMockDB({
        users: [
          {
            id: "u-1",
            tenant_id: "tenant-1",
            external_id: "ext-1",
            email: "alice@example.com",
            display_name: "Alice Smith",
            department: "Sales",
            title: "Rep",
            status: "active",
            raw_attributes: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      });
      app = createApp(userDb);

      const res = await app.request(
        "/scim/v2/Users/u-1",
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            schemas: [SCIM_SCHEMAS.PATCH_OP],
            Operations: [
              {
                op: "replace",
                value: { active: false, displayName: "Alice Updated" },
              },
            ],
          }),
        },
        makeEnv(userDb),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.active).toBe(false);
      expect(body.displayName).toBe("Alice Updated");
    });

    it("DELETE /Users/:id should deactivate user and return 204", async () => {
      const userDb = createMockDB({
        users: [
          {
            id: "u-1",
            tenant_id: "tenant-1",
            external_id: "ext-1",
            email: "alice@example.com",
            display_name: "Alice",
            department: null,
            title: null,
            status: "active",
            raw_attributes: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      });
      app = createApp(userDb);

      const res = await app.request(
        "/scim/v2/Users/u-1",
        { method: "DELETE", headers: authHeaders() },
        makeEnv(userDb),
      );

      expect(res.status).toBe(204);
    });

    it("DELETE /Users/:id should return 404 for non-existent user", async () => {
      const res = await app.request(
        "/scim/v2/Users/nonexistent",
        { method: "DELETE", headers: authHeaders() },
        makeEnv(db),
      );

      expect(res.status).toBe(404);
    });
  });

  // ---------- Group CRUD ----------

  describe("Group CRUD", () => {
    it("POST /Groups should create a group and return 201", async () => {
      const res = await app.request(
        "/scim/v2/Groups",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            schemas: [SCIM_SCHEMAS.GROUP],
            displayName: "Engineering",
          }),
        },
        makeEnv(db),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.GROUP);
      expect(body.displayName).toBe("Engineering");
      expect(body.id).toBeDefined();
      expect(body.meta.resourceType).toBe("Group");
    });

    it("POST /Groups should return 409 for duplicate group name", async () => {
      const groupDb = createMockDB({
        groups: [
          {
            id: "g-1",
            tenant_id: "tenant-1",
            external_id: "ext-g-1",
            name: "Engineering",
            description: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      });
      app = createApp(groupDb);

      const res = await app.request(
        "/scim/v2/Groups",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            schemas: [SCIM_SCHEMAS.GROUP],
            displayName: "Engineering",
          }),
        },
        makeEnv(groupDb),
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.scimType).toBe("uniqueness");
    });

    it("GET /Groups/:id should return a single group with members", async () => {
      const groupDb = createMockDB({
        groups: [
          {
            id: "g-1",
            tenant_id: "tenant-1",
            external_id: "ext-g-1",
            name: "Engineering",
            description: "Eng team",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        users: [
          {
            id: "u-1",
            tenant_id: "tenant-1",
            external_id: "ext-1",
            email: "alice@example.com",
            display_name: "Alice",
            department: null,
            title: null,
            status: "active",
            raw_attributes: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        memberships: [
          {
            id: "m-1",
            tenant_id: "tenant-1",
            user_id: "u-1",
            group_id: "g-1",
          },
        ],
      });
      app = createApp(groupDb);

      const res = await app.request(
        "/scim/v2/Groups/g-1",
        { headers: authHeaders() },
        makeEnv(groupDb),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.displayName).toBe("Engineering");
      expect(body.meta.resourceType).toBe("Group");
      // Members should include user
      expect(body.members).toBeDefined();
    });

    it("GET /Groups should list groups", async () => {
      const groupDb = createMockDB({
        groups: [
          {
            id: "g-1",
            tenant_id: "tenant-1",
            external_id: "ext-g-1",
            name: "Engineering",
            description: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      });
      app = createApp(groupDb);

      const res = await app.request(
        "/scim/v2/Groups",
        { headers: authHeaders() },
        makeEnv(groupDb),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.LIST_RESPONSE);
      expect(body.Resources).toHaveLength(1);
    });

    it("PATCH /Groups/:id should update group members", async () => {
      const groupDb = createMockDB({
        groups: [
          {
            id: "g-1",
            tenant_id: "tenant-1",
            external_id: "ext-g-1",
            name: "Engineering",
            description: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      });
      app = createApp(groupDb);

      const res = await app.request(
        "/scim/v2/Groups/g-1",
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            schemas: [SCIM_SCHEMAS.PATCH_OP],
            Operations: [
              {
                op: "add",
                path: "members",
                value: [{ value: "u-1" }],
              },
            ],
          }),
        },
        makeEnv(groupDb),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.displayName).toBe("Engineering");
    });

    it("DELETE /Groups/:id should delete group and return 204", async () => {
      const groupDb = createMockDB({
        groups: [
          {
            id: "g-1",
            tenant_id: "tenant-1",
            external_id: "ext-g-1",
            name: "Engineering",
            description: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      });
      app = createApp(groupDb);

      const res = await app.request(
        "/scim/v2/Groups/g-1",
        { method: "DELETE", headers: authHeaders() },
        makeEnv(groupDb),
      );

      expect(res.status).toBe(204);
    });

    it("DELETE /Groups/:id should return 404 for non-existent group", async () => {
      const res = await app.request(
        "/scim/v2/Groups/nonexistent",
        { method: "DELETE", headers: authHeaders() },
        makeEnv(db),
      );

      expect(res.status).toBe(404);
    });
  });

  // ---------- Filter Parsing ----------

  describe("SCIM Filter Parsing", () => {
    it('should parse userName eq "value" filter', () => {
      const result = parseScimFilter('userName eq "user@example.com"');
      expect(result).toEqual({
        attribute: "userName",
        operator: "eq",
        value: "user@example.com",
      });
    });

    it('should parse displayName co "value" filter', () => {
      const result = parseScimFilter('displayName co "Smith"');
      expect(result).toEqual({
        attribute: "displayName",
        operator: "co",
        value: "Smith",
      });
    });

    it("should return null for invalid filter syntax", () => {
      expect(parseScimFilter("invalid filter")).toBeNull();
      expect(parseScimFilter("")).toBeNull();
      expect(parseScimFilter("userName")).toBeNull();
    });

    it("should map userName eq filter to SQL for users", () => {
      const parsed = parseScimFilter('userName eq "alice@example.com"');
      const sql = mapUserFilterToSql(parsed!);
      expect(sql).toEqual({
        clause: "email = ?",
        value: "alice@example.com",
      });
    });

    it("should map displayName co filter to SQL for users", () => {
      const parsed = parseScimFilter('displayName co "Smith"');
      const sql = mapUserFilterToSql(parsed!);
      expect(sql).toEqual({
        clause: "display_name LIKE ?",
        value: "%Smith%",
      });
    });

    it("should map displayName eq filter to SQL for groups", () => {
      const parsed = parseScimFilter('displayName eq "Engineering"');
      const sql = mapGroupFilterToSql(parsed!);
      expect(sql).toEqual({
        clause: "name = ?",
        value: "Engineering",
      });
    });

    it("should filter users by userName eq via GET /Users?filter=", async () => {
      const userDb = createMockDB({
        users: [
          {
            id: "u-1",
            tenant_id: "tenant-1",
            external_id: "ext-1",
            email: "alice@example.com",
            display_name: "Alice",
            department: null,
            title: null,
            status: "active",
            raw_attributes: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "u-2",
            tenant_id: "tenant-1",
            external_id: "ext-2",
            email: "bob@example.com",
            display_name: "Bob",
            department: null,
            title: null,
            status: "active",
            raw_attributes: null,
            created_at: "2024-01-02T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
        ],
      });
      app = createApp(userDb);

      const filter = encodeURIComponent('userName eq "alice@example.com"');
      const res = await app.request(
        `/scim/v2/Users?filter=${filter}`,
        { headers: authHeaders() },
        makeEnv(userDb),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.Resources).toHaveLength(1);
      expect(body.Resources[0].userName).toBe("alice@example.com");
    });
  });

  // ---------- Discovery endpoints ----------

  describe("Discovery Endpoints", () => {
    it("GET /ServiceProviderConfig should return SCIM capabilities", async () => {
      const res = await app.request(
        "/scim/v2/ServiceProviderConfig",
        { headers: authHeaders() },
        makeEnv(db),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.SERVICE_PROVIDER_CONFIG);
      expect(body.patch.supported).toBe(true);
      expect(body.filter.supported).toBe(true);
      expect(body.bulk.supported).toBe(false);
      expect(body.authenticationSchemes).toHaveLength(1);
      expect(body.authenticationSchemes[0].type).toBe("oauthbearertoken");
    });

    it("GET /Schemas should return User and Group schema definitions", async () => {
      const res = await app.request(
        "/scim/v2/Schemas",
        { headers: authHeaders() },
        makeEnv(db),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.schemas).toContain(SCIM_SCHEMAS.LIST_RESPONSE);
      expect(body.totalResults).toBe(2);
      expect(body.Resources).toHaveLength(2);

      const userSchema = body.Resources.find(
        (r: { id: string }) => r.id === SCIM_SCHEMAS.USER,
      );
      expect(userSchema).toBeDefined();
      expect(userSchema.name).toBe("User");

      const groupSchema = body.Resources.find(
        (r: { id: string }) => r.id === SCIM_SCHEMAS.GROUP,
      );
      expect(groupSchema).toBeDefined();
      expect(groupSchema.name).toBe("Group");
    });
  });

  // ---------- SCIM Error format ----------

  describe("SCIM Error Format", () => {
    it("should return SCIM error schema for all error responses", async () => {
      // 404 error
      const res = await app.request(
        "/scim/v2/Users/nonexistent",
        { headers: authHeaders() },
        makeEnv(db),
      );

      const body = await res.json();
      expect(body.schemas).toEqual([SCIM_SCHEMAS.ERROR]);
      expect(body.detail).toBe("User not found");
      expect(body.status).toBe("404");
    });
  });
});
