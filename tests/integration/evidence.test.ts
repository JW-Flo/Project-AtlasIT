import { beforeEach, describe, expect, it } from "vitest";
import worker from "../../compliance-worker/src/index";
import { hashCanonicalJson } from "../../src/lib/canonical-json";

class MockR2Object {
  constructor(private body: string) {}
  async text() {
    return this.body;
  }
}

class MockR2Bucket {
  private store = new Map<
    string,
    { body: string; metadata: Record<string, string> }
  >();

  async head(key: string) {
    return this.store.has(key) ? { key } : null;
  }

  async put(
    key: string,
    value: string,
    options?: {
      customMetadata?: Record<string, string>;
    },
  ) {
    this.store.set(key, {
      body: value,
      metadata: options?.customMetadata ?? {},
    });
  }

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    return new MockR2Object(entry.body);
  }
}

class MockD1Statement {
  private args: Array<string | number> = [];

  constructor(
    private db: MockD1Database,
    private query: string,
  ) {}

  bind(...values: Array<string | number>) {
    this.args = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return this.db.first(this.query, this.args) as T | null;
  }

  async run(): Promise<{ success: boolean; meta: { changes: number } }> {
    return this.db.run(this.query, this.args);
  }

  async all(): Promise<{ results: any[] }> {
    return this.db.all(this.query, this.args);
  }
}

class MockD1Database {
  private snapshots = new Map<
    string,
    { id: number; payload: string; generated_at: string; created_at: string }
  >();
  private snapshotCounter = 1;

  private evidenceSeq = 1;
  private evidenceByHash = new Map<
    string,
    {
      id: number;
      hash: string;
      tenant_id: string;
      pack: string;
      subject_ref: string | null;
      payload: string;
      created_at: string;
    }
  >();

  prepare(query: string) {
    return new MockD1Statement(this, query);
  }

  async exec(_query: string) {
    return { success: true };
  }

  private nowIso() {
    return new Date().toISOString();
  }

  async run(query: string, args: Array<string | number>) {
    if (query.includes("INSERT INTO snapshots")) {
      const [tenantId, generatedAt, payload] = args as [string, string, string];
      const existing = this.snapshots.get(tenantId);
      if (existing) {
        existing.generated_at = generatedAt;
        existing.payload = payload;
        existing.created_at = this.nowIso();
        return { success: true, meta: { changes: 1 } };
      }
      this.snapshots.set(tenantId, {
        id: this.snapshotCounter++,
        generated_at: generatedAt,
        payload,
        created_at: this.nowIso(),
      });
      return { success: true, meta: { changes: 1 } };
    }

    if (query.includes("INSERT INTO evidence_index")) {
      const [hash, tenantId, pack, subject, payload] = args as [
        string,
        string,
        string,
        string,
        string,
      ];
      if (this.evidenceByHash.has(hash)) {
        return { success: true, meta: { changes: 0 } };
      }
      const row = {
        id: this.evidenceSeq++,
        hash,
        tenant_id: tenantId,
        pack,
        subject_ref: subject || null,
        payload,
        created_at: this.nowIso(),
      };
      this.evidenceByHash.set(hash, row);
      return { success: true, meta: { changes: 1 } };
    }

    throw new Error(`Unsupported run query: ${query}`);
  }

  async first(query: string, args: Array<string | number>) {
    if (query.includes("FROM snapshots WHERE tenant_id")) {
      const [tenantId] = args as [string];
      const row = this.snapshots.get(tenantId);
      if (!row) return null;
      return {
        payload: row.payload,
        generated_at: row.generated_at,
      };
    }

    if (query.includes("FROM snapshots ORDER BY generated_at")) {
      let latest: { generated_at: string } | null = null;
      for (const row of this.snapshots.values()) {
        if (!latest || row.generated_at > latest.generated_at) {
          latest = { generated_at: row.generated_at };
        }
      }
      return latest;
    }

    if (query.includes("COUNT(*) as count FROM evidence_index")) {
      return { count: this.evidenceByHash.size };
    }

    return null;
  }

  async all(query: string, args: Array<string | number>) {
    if (!query.includes("FROM evidence_index")) {
      throw new Error(`Unsupported all query: ${query}`);
    }

    const filterOrder: Array<"tenant" | "pack" | "subject" | "cursor"> = [];
    if (query.includes("tenant_id = ?")) filterOrder.push("tenant");
    if (query.includes("pack = ?")) filterOrder.push("pack");
    if (query.includes("subject_ref = ?")) filterOrder.push("subject");
    if (query.includes("id < ?")) filterOrder.push("cursor");

    const limit = Number(args[args.length - 1]);
    const values = args.slice(0, args.length - 1);
    const filters: Record<string, string | number> = {};

    filterOrder.forEach((key, index) => {
      filters[key] = values[index];
    });

    let rows = Array.from(this.evidenceByHash.values());
    rows.sort((a, b) => b.id - a.id);

    if (typeof filters.tenant === "string") {
      rows = rows.filter((row) => row.tenant_id === filters.tenant);
    }
    if (typeof filters.pack === "string") {
      rows = rows.filter((row) => row.pack === filters.pack);
    }
    if (typeof filters.subject === "string") {
      rows = rows.filter((row) => row.subject_ref === filters.subject);
    }
    if (typeof filters.cursor === "number") {
      rows = rows.filter((row) => row.id < filters.cursor);
    }

    return { results: rows.slice(0, limit) };
  }
}

type TestEnv = {
  atlasit_compliance: MockD1Database;
  atlasit_evidence: MockR2Bucket;
  BUILD_VERSION: string;
};

function createEnv(): TestEnv {
  return {
    atlasit_compliance: new MockD1Database(),
    atlasit_evidence: new MockR2Bucket(),
    BUILD_VERSION: "test",
  };
}

async function invoke(
  env: TestEnv,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const req = new Request(`https://example.com${path}`, {
    headers: init?.headers ?? { "content-type": "application/json" },
    ...init,
  });
  return (worker as any).fetch(req, env);
}

describe("canonical hashing", () => {
  it("produces stable hash regardless of key order", async () => {
    const inputA = { b: 1, a: 2, nested: { y: true, x: [3, 2, 1] } };
    const inputB = { nested: { x: [3, 2, 1], y: true }, a: 2, b: 1 };

    const first = await hashCanonicalJson(inputA);
    const second = await hashCanonicalJson(inputB);

    expect(first.hash).toBe(second.hash);
    expect(first.canonical).toBe(second.canonical);
  });
});

describe("evidence ingest lifecycle", () => {
  let env: TestEnv;

  beforeEach(() => {
    env = createEnv();
  });

  it("ingests, reuses duplicates, and supports search pagination", async () => {
    const envelope = {
      tenantId: "demo",
      policyPack: { name: "baseline", version: "1.0.0" },
      subject: { userId: "user-1" },
      result: { allow: true },
      createdAt: "2025-10-10T00:00:00.000Z",
    };

    const firstResponse = await invoke(env, "/api/evidence/ingest", {
      method: "POST",
      body: JSON.stringify({
        tenantId: "demo",
        pack: "baseline@1.0.0",
        subject: "user-1",
        payload: envelope,
      }),
    });
    expect(firstResponse.status).toBe(200);
    const firstJson: any = await firstResponse.json();
    expect(firstJson.stored).toBe(true);

    const duplicate = await invoke(env, "/api/evidence/ingest", {
      method: "POST",
      body: JSON.stringify({
        tenantId: "demo",
        pack: "baseline@1.0.0",
        subject: "user-1",
        payload: envelope,
      }),
    });
    const dupJson: any = await duplicate.json();
    expect(dupJson.hash).toBe(firstJson.hash);
    expect(dupJson.stored).toBe(false);

    const secondEnvelope = {
      ...envelope,
      subject: { userId: "user-2" },
      createdAt: "2025-10-10T00:05:00.000Z",
    };

    const secondResponse = await invoke(env, "/api/evidence/ingest", {
      method: "POST",
      body: JSON.stringify({
        tenantId: "demo",
        pack: "baseline@1.0.0",
        subject: "user-2",
        payload: secondEnvelope,
      }),
    });
    const secondJson: any = await secondResponse.json();
    expect(secondJson.stored).toBe(true);
    expect(secondJson.hash).not.toBe(firstJson.hash);

    const retrieve = await invoke(env, `/api/evidence/${firstJson.hash}`, {
      method: "GET",
    });
    expect(retrieve.status).toBe(200);
    const storedEnvelope = await retrieve.json();
    expect(storedEnvelope.tenantId).toBe("demo");
    expect(storedEnvelope.subject.userId).toBe("user-1");

    const searchPageOne = await invoke(
      env,
      "/api/evidence/search?tenantId=demo&limit=1",
    );
    const searchJson: any = await searchPageOne.json();
    expect(searchJson.items).toHaveLength(1);
    expect(searchJson.count).toBe(1);
    expect(searchJson.items[0].hash).toBe(secondJson.hash);
    expect(searchJson.nextCursor).toBeDefined();

    const searchPageTwo = await invoke(
      env,
      `/api/evidence/search?tenantId=demo&cursor=${searchJson.nextCursor}`,
    );
    const searchTwoJson: any = await searchPageTwo.json();
    expect(searchTwoJson.items).toHaveLength(1);
    expect(searchTwoJson.items[0].hash).toBe(firstJson.hash);

    const health = await invoke(env, "/health");
    const healthJson: any = await health.json();
    expect(healthJson.evidenceCount).toBe(2);
  });

  it("exposes security headers on snapshot HEAD", async () => {
    const response = await invoke(env, "/api/compliance/snapshot", {
      method: "HEAD",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("strict-transport-security")).toContain(
      "max-age",
    );
    expect(response.headers.get("permissions-policy")).toContain("camera=");
  });
});
