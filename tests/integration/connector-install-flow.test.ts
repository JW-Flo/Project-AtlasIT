import { describe, expect, it, beforeEach } from "vitest";
import marketplaceApp from "../../marketplace/src/index";

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
      const eqMatch = cond.trim().match(/(\w+)\.?(\w*)\s*=\s*\?/);
      const neqMatch = cond.trim().match(/(\w+)\.?(\w*)\s*!=\s*'([^']+)'/);
      const isNullMatch = cond.trim().match(/(\w+)\s+IS\s+NULL/i);

      if (eqMatch) {
        const col = eqMatch[2] || eqMatch[1];
        const val = params[localIdx++];
        return row[col] === val;
      }
      if (neqMatch) {
        const col = neqMatch[2] || neqMatch[1];
        const val = neqMatch[3];
        return row[col] !== val;
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

  // Map columns to params, handling literal values in VALUES clause
  const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
  if (!valuesMatch) return {};
  const valuePlaceholders = valuesMatch[1].split(",").map((v) => v.trim());

  let paramIdx = 0;
  columns.forEach((col, i) => {
    const placeholder = valuePlaceholders[i];
    if (placeholder === "?") {
      row[col] = params[paramIdx++] ?? null;
    } else {
      // Literal value like 'installed'
      const literalMatch = placeholder.match(/^'([^']*)'$/);
      row[col] = literalMatch ? literalMatch[1] : placeholder;
    }
  });

  row.created_at = row.created_at ?? new Date().toISOString();
  row.installed_at = row.installed_at ?? new Date().toISOString();
  return row;
}

function buildUpdateFields(sql: string, params: unknown[]): Row {
  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
  if (!setMatch) return {};
  const assignments = setMatch[1].split(",").map((a) => a.trim());
  const updates: Row = {};
  let paramIdx = 0;
  for (const assignment of assignments) {
    const eqParamMatch = assignment.match(/(\w+)\s*=\s*\?/);
    const literalMatch = assignment.match(/(\w+)\s*=\s*'([^']*)'/);
    const fnMatch = assignment.match(/(\w+)\s*=\s*\w+\(/);
    if (eqParamMatch) {
      updates[eqParamMatch[1]] = params[paramIdx++];
    } else if (literalMatch) {
      updates[literalMatch[1]] = literalMatch[2];
    } else if (fnMatch) {
      updates[fnMatch[1]] = new Date().toISOString();
    }
  }
  return updates;
}

function createMockDB(): MockDB {
  const tables: Record<string, Row[]> = {
    marketplace_apps: [],
    tenant_app_installs: [],
  };

  // Track unique constraints: tenant_id + app_id for installs
  const uniqueInstallKeys = new Set<string>();

  const db = {
    prepare: (sql: string) => ({
      bind: (...params: unknown[]) => ({
        first: async <T = Row>(): Promise<T | null> => {
          const upperSql = sql.toUpperCase();

          if (upperSql.includes("COUNT(*)")) {
            const tableName = extractTableName(sql);
            const rows = tables[tableName] ?? [];
            const filtered = applyWhereFilters(rows, sql, params);
            return { total: filtered.length } as unknown as T;
          }

          // Handle JOIN queries (install + app details)
          if (upperSql.includes("JOIN")) {
            const installs = tables["tenant_app_installs"] ?? [];
            const apps = tables["marketplace_apps"] ?? [];
            const filtered = applyWhereFilters(installs, sql, params);
            if (filtered.length === 0) return null;
            const install = filtered[0];
            const app = apps.find((a) => a.id === install.app_id);
            if (!app) return null;
            return {
              ...install,
              app_name: app.name,
              app_slug: app.slug,
              app_category: app.category,
              app_logo_url: app.logo_url,
              app_provider: app.provider,
            } as unknown as T;
          }

          const tableName = extractTableName(sql);
          const rows = tables[tableName] ?? [];
          const filtered = applyWhereFilters(rows, sql, params);

          if (filtered.length === 0) return null;

          // If selecting specific columns, project them
          const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
          if (selectMatch && !selectMatch[1].includes("*")) {
            const cols = selectMatch[1].split(",").map((c) => c.trim());
            const projected: Row = {};
            for (const col of cols) {
              projected[col] = filtered[0][col];
            }
            return projected as unknown as T;
          }

          return filtered[0] as unknown as T;
        },
        all: async (): Promise<{ results: Row[] }> => {
          const upperSql = sql.toUpperCase();

          // Handle JOIN queries
          if (upperSql.includes("JOIN")) {
            const installs = tables["tenant_app_installs"] ?? [];
            const apps = tables["marketplace_apps"] ?? [];
            const filtered = applyWhereFilters(installs, sql, params);
            return {
              results: filtered
                .map((install) => {
                  const app = apps.find((a) => a.id === install.app_id);
                  if (!app) return null;
                  return {
                    ...install,
                    app_name: app.name,
                    app_slug: app.slug,
                    app_category: app.category,
                    app_logo_url: app.logo_url,
                    app_provider: app.provider,
                  };
                })
                .filter(Boolean) as Row[],
            };
          }

          const tableName = extractTableName(sql);
          const rows = tables[tableName] ?? [];
          const filtered = applyWhereFilters(rows, sql, params);
          return { results: filtered };
        },
        run: async (): Promise<{ success: boolean }> => {
          const tableName = extractTableName(sql);
          const upperSql = sql.trim().toUpperCase();

          if (upperSql.startsWith("INSERT")) {
            // Check unique constraint for tenant_app_installs
            if (tableName === "tenant_app_installs") {
              const row = buildInsertRow(sql, params);
              const key = `${row.tenant_id}:${row.app_id}`;
              if (uniqueInstallKeys.has(key)) {
                throw new Error(
                  "D1_ERROR: UNIQUE constraint failed: tenant_app_installs.tenant_id, tenant_app_installs.app_id",
                );
              }
              uniqueInstallKeys.add(key);
              if (!tables[tableName]) tables[tableName] = [];
              tables[tableName].push(row);
            } else {
              const row = buildInsertRow(sql, params);
              if (!tables[tableName]) tables[tableName] = [];
              tables[tableName].push(row);
            }
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
              tables[tableName] = (tables[tableName] ?? []).filter(
                (row) => !matchesWhereClause(row, sql, params),
              );
            }
          }

          return { success: true };
        },
      }),
    }),
  };

  return { tables, db };
}

const APP_ID = "11111111-1111-4111-8111-111111111111";
const TENANT_ID = "22222222-2222-4222-8222-222222222222";

function seedApp(mockDB: MockDB): void {
  mockDB.tables.marketplace_apps.push({
    id: APP_ID,
    status: "active",
    name: "Google Workspace",
    slug: "google-workspace",
    category: "productivity",
    logo_url: null,
    provider: "google",
    auth_model: "oauth2",
    version: "1.0.0",
  });
}

function createEnv(mockDB: MockDB) {
  return {
    DB: mockDB.db as unknown as D1Database,
    KV_CACHE: {} as KVNamespace,
    API_ALLOWED_KEYS: "",
  };
}

async function installApp(
  env: ReturnType<typeof createEnv>,
  overrides: Record<string, unknown> = {},
) {
  return marketplaceApp.request(
    "/api/v1/installs",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tenant_id: TENANT_ID,
        app_id: APP_ID,
        config: { domain: "example.com" },
        ...overrides,
      }),
    },
    env,
  );
}

describe("connector install flow", () => {
  let mockDB: MockDB;
  let env: ReturnType<typeof createEnv>;

  beforeEach(() => {
    mockDB = createMockDB();
    env = createEnv(mockDB);
    seedApp(mockDB);
  });

  describe("list available apps from catalog", () => {
    it("returns apps from the catalog", async () => {
      const res = await marketplaceApp.request(
        "/api/v1/apps",
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe("Google Workspace");
      expect(body.meta.total).toBe(1);
    });

    it("returns a single app by ID", async () => {
      const res = await marketplaceApp.request(
        `/api/v1/apps/${APP_ID}`,
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(APP_ID);
      expect(body.data.slug).toBe("google-workspace");
    });

    it("returns 404 for unknown app", async () => {
      const res = await marketplaceApp.request(
        "/api/v1/apps/00000000-0000-4000-8000-000000000000",
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe("NOT_FOUND");
    });
  });

  describe("install an app for a tenant", () => {
    it("installs an app and returns 201", async () => {
      const res = await installApp(env);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.tenant_id).toBe(TENANT_ID);
      expect(body.data.app_id).toBe(APP_ID);
      expect(body.data.status).toBe("installed");
      expect(body.data.id).toBeDefined();
    });

    it("returns 404 when app does not exist", async () => {
      const res = await installApp(env, {
        app_id: "99999999-9999-4999-8999-999999999999",
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe("NOT_FOUND");
    });

    it("returns 400 for invalid payload", async () => {
      const res = await marketplaceApp.request(
        "/api/v1/installs",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tenant_id: "not-a-uuid" }),
        },
        env,
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("VALIDATION_FAILED");
    });
  });

  describe("reject duplicate install", () => {
    it("returns 409 when app is already installed for tenant", async () => {
      const first = await installApp(env);
      expect(first.status).toBe(201);

      const duplicate = await installApp(env);
      expect(duplicate.status).toBe(409);
      const body = await duplicate.json();
      expect(body.code).toBe("CONFLICT");
    });
  });

  describe("update install config", () => {
    it("updates config via PATCH", async () => {
      const installRes = await installApp(env);
      const { data } = await installRes.json();
      const installId = data.id;

      const patchRes = await marketplaceApp.request(
        `/api/v1/installs/${installId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status: "configuring",
            config: { domain: "updated.example.com" },
          }),
        },
        env,
      );

      expect(patchRes.status).toBe(200);
      const body = await patchRes.json();
      expect(body.status).toBe("success");
      expect(body.data.status).toBe("configuring");
    });

    it("returns 404 for non-existent install", async () => {
      const res = await marketplaceApp.request(
        "/api/v1/installs/00000000-0000-4000-8000-000000000000",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "configuring" }),
        },
        env,
      );

      expect(res.status).toBe(404);
    });
  });

  describe("activate an install", () => {
    it("activates an installed app", async () => {
      const installRes = await installApp(env);
      const { data } = await installRes.json();
      const installId = data.id;

      const activateRes = await marketplaceApp.request(
        `/api/v1/installs/${installId}/activate`,
        { method: "POST" },
        env,
      );

      expect(activateRes.status).toBe(200);
      const body = await activateRes.json();
      expect(body.data.status).toBe("active");
    });

    it("returns 404 for non-existent install", async () => {
      const res = await marketplaceApp.request(
        "/api/v1/installs/00000000-0000-4000-8000-000000000000/activate",
        { method: "POST" },
        env,
      );

      expect(res.status).toBe(404);
    });
  });

  describe("uninstall an app", () => {
    it("soft-deletes via DELETE and sets status to uninstalled", async () => {
      const installRes = await installApp(env);
      const { data } = await installRes.json();
      const installId = data.id;

      const deleteRes = await marketplaceApp.request(
        `/api/v1/installs/${installId}`,
        { method: "DELETE" },
        env,
      );

      expect(deleteRes.status).toBe(200);
      const body = await deleteRes.json();
      expect(body.data.uninstalled).toBe(true);

      // Verify the row is marked uninstalled in the mock DB
      const row = mockDB.tables.tenant_app_installs.find(
        (r) => r.id === installId,
      );
      expect(row?.status).toBe("uninstalled");
    });

    it("returns 404 for non-existent install", async () => {
      const res = await marketplaceApp.request(
        "/api/v1/installs/00000000-0000-4000-8000-000000000000",
        { method: "DELETE" },
        env,
      );

      expect(res.status).toBe(404);
    });
  });

  describe("full lifecycle: install -> configure -> activate -> uninstall", () => {
    it("completes the full connector lifecycle", async () => {
      // Step 1: Install
      const installRes = await installApp(env);
      expect(installRes.status).toBe(201);
      const installBody = await installRes.json();
      const installId = installBody.data.id;
      expect(installBody.data.status).toBe("installed");

      // Step 2: Configure
      const configureRes = await marketplaceApp.request(
        `/api/v1/installs/${installId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status: "configuring",
            config: { domain: "prod.example.com", sync_interval: 300 },
          }),
        },
        env,
      );
      expect(configureRes.status).toBe(200);
      const configBody = await configureRes.json();
      expect(configBody.data.status).toBe("configuring");

      // Step 3: Activate
      const activateRes = await marketplaceApp.request(
        `/api/v1/installs/${installId}/activate`,
        { method: "POST" },
        env,
      );
      expect(activateRes.status).toBe(200);
      const activateBody = await activateRes.json();
      expect(activateBody.data.status).toBe("active");

      // Step 4: Uninstall
      const uninstallRes = await marketplaceApp.request(
        `/api/v1/installs/${installId}`,
        { method: "DELETE" },
        env,
      );
      expect(uninstallRes.status).toBe(200);
      const uninstallBody = await uninstallRes.json();
      expect(uninstallBody.data.uninstalled).toBe(true);

      // Verify final state
      const row = mockDB.tables.tenant_app_installs.find(
        (r) => r.id === installId,
      );
      expect(row?.status).toBe("uninstalled");

      // Verify cannot re-activate after uninstall
      const reactivateRes = await marketplaceApp.request(
        `/api/v1/installs/${installId}/activate`,
        { method: "POST" },
        env,
      );
      expect(reactivateRes.status).toBe(400);
      const reactivateBody = await reactivateRes.json();
      expect(reactivateBody.code).toBe("VALIDATION_FAILED");
    });
  });
});
