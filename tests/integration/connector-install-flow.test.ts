import { describe, expect, it } from "vitest";
import marketplaceApp from "../../marketplace/src/index";

type InstallStatus =
  | "installed"
  | "configuring"
  | "active"
  | "error"
  | "uninstalled";

interface MarketplaceAppRow {
  id: string;
  status: string;
  name: string;
  slug: string;
  category: string;
  logo_url: string | null;
  provider: string;
}

interface InstallRow {
  id: string;
  tenant_id: string;
  app_id: string;
  status: InstallStatus;
  config: string | null;
}

class MockD1Statement {
  private params: unknown[] = [];

  constructor(
    private readonly db: MockD1Database,
    private readonly query: string,
  ) {}

  bind(...params: unknown[]): MockD1Statement {
    this.params = params;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return this.db.first<T>(this.query, this.params);
  }

  async all<T extends Record<string, unknown>>(): Promise<{ results: T[] }> {
    return { results: await this.db.all<T>(this.query, this.params) };
  }

  async run(): Promise<{ success: boolean }> {
    await this.db.run(this.query, this.params);
    return { success: true };
  }
}

class MockD1Database {
  readonly apps = new Map<string, MarketplaceAppRow>();
  readonly installs = new Map<string, InstallRow>();

  prepare(query: string): MockD1Statement {
    return new MockD1Statement(this, query);
  }

  async first<T>(query: string, params: unknown[]): Promise<T | null> {
    if (query.includes("FROM marketplace_apps WHERE id = ?")) {
      const appId = String(params[0] ?? "");
      return (this.apps.get(appId) as T | undefined) ?? null;
    }

    if (query.includes("SELECT * FROM tenant_app_installs WHERE id = ?")) {
      const id = String(params[0] ?? "");
      return (this.installs.get(id) as T | undefined) ?? null;
    }

    if (
      query.includes("SELECT id, status FROM tenant_app_installs WHERE id = ?")
    ) {
      const id = String(params[0] ?? "");
      const row = this.installs.get(id);
      return row ? ({ id: row.id, status: row.status } as T) : null;
    }

    return null;
  }

  async all<T>(_query: string, _params: unknown[]): Promise<T[]> {
    return [];
  }

  async run(query: string, params: unknown[]): Promise<void> {
    if (query.includes("INSERT INTO tenant_app_installs")) {
      const [id, tenantId, appId, config] = params;
      this.installs.set(String(id), {
        id: String(id),
        tenant_id: String(tenantId),
        app_id: String(appId),
        status: "installed",
        config: typeof config === "string" ? config : null,
      });
      return;
    }

    if (query.includes("SET status = 'active'")) {
      const id = String(params[0] ?? "");
      const existing = this.installs.get(id);
      if (existing) {
        existing.status = "active";
      }
      return;
    }

    if (query.includes("SET status = 'uninstalled'")) {
      const id = String(params[0] ?? "");
      const existing = this.installs.get(id);
      if (existing) {
        existing.status = "uninstalled";
      }
    }
  }
}

describe("connector install flow", () => {
  it("installs, configures, activates, and uninstalls with mock D1", async () => {
    const db = new MockD1Database();
    const appId = "11111111-1111-4111-8111-111111111111";
    const tenantId = "22222222-2222-4222-8222-222222222222";

    db.apps.set(appId, {
      id: appId,
      status: "active",
      name: "Google Workspace",
      slug: "google-workspace",
      category: "productivity",
      logo_url: null,
      provider: "google",
    });

    const installResponse = await marketplaceApp.request(
      "/api/v1/installs",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          app_id: appId,
          config: { domain: "example.com" },
        }),
      },
      { DB: db as unknown as D1Database },
    );

    expect(installResponse.status).toBe(201);
    const installBody = await installResponse.json<{ data: { id: string } }>();
    const installId = installBody.data.id;

    const configureResponse = await marketplaceApp.request(
      `/api/v1/installs/${installId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "configuring",
          config: { domain: "example.org" },
        }),
      },
      { DB: db as unknown as D1Database },
    );
    expect(configureResponse.status).toBe(200);

    const activateResponse = await marketplaceApp.request(
      `/api/v1/installs/${installId}/activate`,
      { method: "POST" },
      { DB: db as unknown as D1Database },
    );
    expect(activateResponse.status).toBe(200);

    const uninstallResponse = await marketplaceApp.request(
      `/api/v1/installs/${installId}`,
      { method: "DELETE" },
      { DB: db as unknown as D1Database },
    );
    expect(uninstallResponse.status).toBe(200);

    expect(db.installs.get(installId)?.status).toBe("uninstalled");
  });
});
