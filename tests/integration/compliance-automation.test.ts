import { beforeEach, describe, expect, it } from "vitest";
import worker from "../../compliance-worker/src/index";
import { sha256Hex } from "../../src/lib/canonical-json";

class MockR2Object {
  constructor(private readonly body: string) {}
  async text() {
    return this.body;
  }
}

class MockR2Bucket {
  private readonly store = new Map<
    string,
    { body: string; metadata?: Record<string, string> }
  >();

  async head(key: string) {
    return this.store.has(key) ? { key } : null;
  }

  async put(
    key: string,
    value: string,
    options?: { customMetadata?: Record<string, string> },
  ) {
    this.store.set(key, { body: value, metadata: options?.customMetadata });
  }

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    return new MockR2Object(entry.body);
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  listKeys() {
    return Array.from(this.store.keys());
  }
}

class MockKVNamespace {
  private readonly store = new Map<string, string>();

  async get(key: string, options?: { type?: "json" | "text" }) {
    const value = this.store.get(key);
    if (value === undefined) return null;
    if (options?.type === "json") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  async put(key: string, value: string) {
    this.store.set(key, value);
  }

  async delete(key: string) {
    this.store.delete(key);
  }
}

class MockD1Statement {
  private bindings: Array<string | number> = [];

  constructor(
    private readonly db: MockD1Database,
    private readonly query: string,
  ) {}

  bind(...values: Array<string | number>) {
    this.bindings = values;
    return this;
  }

  async run() {
    return this.db.run(this.query, this.bindings);
  }

  async first<T>() {
    return this.db.first<T>(this.query, this.bindings);
  }

  async all<T>() {
    return this.db.all<T>(this.query, this.bindings);
  }
}

class MockD1Database {
  private snapshots = new Map<
    string,
    { payload: string; generatedAt: string }
  >();
  private evidenceSeq = 1;
  private evidenceById = new Map<
    number,
    {
      id: number;
      hash: string;
      tenantId: string;
      pack: string;
      subject: string;
      payload: string;
      createdAt: string;
    }
  >();
  private evidenceByHash = new Map<string, number>();

  private workflowTemplates = new Map<
    string,
    { payload: string; updatedAt: string }
  >();
  private workflowExecutions = new Map<
    string,
    {
      id: string;
      tenantId: string;
      workflowType: string;
      subjectRef: string | null;
      status: string;
      createdAt: string;
      updatedAt: string;
      completedAt: string | null;
      durationMs: number;
      idempotencyKey: string | null;
      contextJson: string;
    }
  >();
  private executionIdempotency = new Map<string, string>();
  private workflowSteps = new Map<
    string,
    Array<{
      stepId: string;
      action: string;
      status: string;
      attempts: number;
      outputJson: string | null;
      error: string | null;
      startedAt: string | null;
      completedAt: string | null;
      durationMs: number;
      order: number;
    }>
  >();

  private policyTemplates = new Map<
    string,
    { name: string; format: string; body: string }
  >();
  private generatedPolicies = new Map<
    string,
    {
      hash: string;
      tenantId: string;
      templateKey: string;
      content: string;
      contextHash: string;
      inputCanonical: string;
      createdAt: string;
      sizeBytes: number;
    }
  >();
  private generatedByContext = new Map<string, string>();
  private internalControls = new Map<
    string,
    { framework: string; title: string; description?: string }
  >();
  private controlEvidence = new Map<string, Map<string, Set<string>>>();

  prepare(query: string) {
    return new MockD1Statement(this, query);
  }

  async exec(_query: string) {
    return { success: true };
  }

  private nowIso() {
    return new Date().toISOString();
  }

  private setGeneratedContext(
    tenantId: string,
    templateKey: string,
    contextHash: string,
    hash: string,
  ) {
    this.generatedByContext.set(
      `${tenantId}:${templateKey}:${contextHash}`,
      hash,
    );
  }

  async run(query: string, bindings: Array<string | number>) {
    if (query.includes("INSERT INTO workflow_templates")) {
      const [type, payload, _created, updated] = bindings as [
        string,
        string,
        string,
        string,
      ];
      this.workflowTemplates.set(type, { payload, updatedAt: updated });
      return { success: true, meta: { changes: 1 } };
    }

    if (query.startsWith("INSERT INTO workflow_executions")) {
      const [
        id,
        tenant,
        type,
        subject,
        status,
        createdAt,
        updatedAt,
        completedAt,
        duration,
        idempotency,
        context,
      ] = bindings as [
        string,
        string,
        string,
        string | null,
        string,
        string,
        string,
        string | null,
        number | string,
        string | null,
        string,
      ];
      const durationNumber =
        typeof duration === "number"
          ? duration
          : parseInt(String(duration) || "0", 10) || 0;
      const record = {
        id,
        tenantId: tenant,
        workflowType: type,
        subjectRef: subject ?? null,
        status,
        createdAt,
        updatedAt,
        completedAt: completedAt ?? null,
        durationMs: durationNumber,
        idempotencyKey: idempotency ?? null,
        contextJson: context,
      };
      this.workflowExecutions.set(id, record);
      if (record.idempotencyKey) {
        this.executionIdempotency.set(`${tenant}:${record.idempotencyKey}`, id);
      }
      return { success: true, meta: { changes: 1 } };
    }

    if (query.startsWith("DELETE FROM workflow_steps")) {
      const [executionId] = bindings as [string];
      this.workflowSteps.set(executionId, []);
      return { success: true, meta: { changes: 1 } };
    }

    if (query.startsWith("INSERT INTO workflow_steps")) {
      const [
        executionId,
        stepId,
        action,
        status,
        attempts,
        outputJson,
        error,
        startedAt,
        completedAt,
        duration,
      ] = bindings as [
        string,
        string,
        string,
        string,
        number,
        string | null,
        string | null,
        string | null,
        string | null,
        number | string,
      ];
      const list = this.workflowSteps.get(executionId) ?? [];
      const durationNumber =
        typeof duration === "number"
          ? duration
          : parseInt(String(duration) || "0", 10) || 0;
      list.push({
        stepId,
        action,
        status,
        attempts,
        outputJson,
        error,
        startedAt,
        completedAt,
        durationMs: durationNumber,
        order: list.length + 1,
      });
      this.workflowSteps.set(executionId, list);
      return { success: true, meta: { changes: 1 } };
    }

    if (query.includes("INSERT INTO policy_templates")) {
      const [key, name, format, body] = bindings as [
        string,
        string,
        string,
        string,
        string,
        string,
      ];
      this.policyTemplates.set(key, { name, format, body });
      return { success: true, meta: { changes: 1 } };
    }

    if (query.includes("INSERT INTO internal_controls")) {
      const [key, framework, title, description] = bindings as [
        string,
        string,
        string,
        string | null,
      ];
      this.internalControls.set(key, {
        framework,
        title,
        description: description ?? undefined,
      });
      return { success: true, meta: { changes: 1 } };
    }

    if (query.includes("INSERT OR IGNORE INTO control_mappings")) {
      return { success: true, meta: { changes: 1 } };
    }

    if (query.startsWith("INSERT INTO generated_policies")) {
      const [
        hash,
        tenantId,
        templateKey,
        content,
        contextHash,
        inputCanonical,
        createdAt,
        sizeBytes,
      ] = bindings as [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        number | string,
      ];
      const size =
        typeof sizeBytes === "number"
          ? sizeBytes
          : parseInt(String(sizeBytes) || "0", 10) ||
            new TextEncoder().encode(content).byteLength;
      this.generatedPolicies.set(hash, {
        hash,
        tenantId,
        templateKey,
        content,
        contextHash,
        inputCanonical,
        createdAt,
        sizeBytes: size,
      });
      this.setGeneratedContext(tenantId, templateKey, contextHash, hash);
      return { success: true, meta: { changes: 1 } };
    }

    if (query.startsWith("INSERT INTO policy_evaluations")) {
      return { success: true, meta: { changes: 1 } };
    }

    if (query.includes("INSERT OR IGNORE INTO control_evidence_links")) {
      const [controlKey, tenantId, evidenceHash] = bindings as [
        string,
        string,
        string,
        string,
      ];
      const byTenant =
        this.controlEvidence.get(controlKey) ?? new Map<string, Set<string>>();
      const set = byTenant.get(tenantId) ?? new Set<string>();
      set.add(evidenceHash);
      byTenant.set(tenantId, set);
      this.controlEvidence.set(controlKey, byTenant);
      return { success: true, meta: { changes: 1 } };
    }

    if (query.includes("INSERT INTO evidence_index")) {
      const [hash, tenantId, pack, subject, payload] = bindings as [
        string,
        string,
        string,
        string,
        string,
      ];
      if (this.evidenceByHash.has(hash)) {
        return { success: true, meta: { changes: 0 } };
      }
      const id = this.evidenceSeq++;
      const createdAt = this.nowIso();
      this.evidenceByHash.set(hash, id);
      this.evidenceById.set(id, {
        id,
        hash,
        tenantId,
        pack,
        subject,
        payload,
        createdAt,
      });
      return { success: true, meta: { changes: 1 } };
    }

    if (query.includes("INSERT INTO snapshots")) {
      const [tenantId, generatedAt, payload] = bindings as [
        string,
        string,
        string,
      ];
      this.snapshots.set(tenantId, { generatedAt, payload });
      return { success: true, meta: { changes: 1 } };
    }

    return { success: true, meta: { changes: 0 } };
  }

  async first<T>(query: string, bindings: Array<string | number>) {
    if (query.includes("FROM snapshots WHERE tenant_id")) {
      const [tenantId] = bindings as [string];
      const snap = this.snapshots.get(tenantId);
      if (!snap) return null;
      return { payload: snap.payload, generated_at: snap.generatedAt } as T;
    }

    if (query.includes("FROM snapshots ORDER BY")) {
      let latest: { generated_at: string } | null = null;
      for (const snap of this.snapshots.values()) {
        if (!latest || snap.generatedAt > latest.generated_at) {
          latest = { generated_at: snap.generatedAt };
        }
      }
      return latest as T;
    }

    if (query.includes("COUNT(*) as count FROM evidence_index")) {
      return { count: this.evidenceById.size } as T;
    }

    if (
      query.includes("FROM workflow_executions") &&
      query.includes("id = ?")
    ) {
      const [id, tenantId] = bindings as [string, string];
      const exec = this.workflowExecutions.get(id);
      if (!exec || exec.tenantId !== tenantId) return null;
      return {
        id: exec.id,
        tenant_id: exec.tenantId,
        workflow_type: exec.workflowType,
        subject_ref: exec.subjectRef,
        status: exec.status,
        created_at: exec.createdAt,
        updated_at: exec.updatedAt,
        completed_at: exec.completedAt,
        duration_ms: exec.durationMs,
        idempotency_key: exec.idempotencyKey,
        context_json: exec.contextJson,
      } as T;
    }

    if (
      query.includes("FROM workflow_executions") &&
      query.includes("idempotency_key")
    ) {
      const [tenantId, idempotencyKey] = bindings as [string, string];
      const id = this.executionIdempotency.get(`${tenantId}:${idempotencyKey}`);
      if (!id) return null;
      return { id } as T;
    }

    if (query.includes("FROM policy_templates WHERE key")) {
      const [key] = bindings as [string];
      const tpl = this.policyTemplates.get(key);
      if (!tpl) return null;
      return { key, name: tpl.name, format: tpl.format, body: tpl.body } as T;
    }

    if (
      query.includes("FROM generated_policies") &&
      query.includes("context_hash")
    ) {
      const [tenantId, templateKey, contextHash] = bindings as [
        string,
        string,
        string,
      ];
      const hash = this.generatedByContext.get(
        `${tenantId}:${templateKey}:${contextHash}`,
      );
      if (!hash) return null;
      const record = this.generatedPolicies.get(hash);
      if (!record) return null;
      return {
        hash: record.hash,
        tenant_id: record.tenantId,
        template_key: record.templateKey,
        content: record.content,
        context_hash: record.contextHash,
        created_at: record.createdAt,
        size_bytes: record.sizeBytes,
      } as T;
    }

    if (query.includes("SELECT control_key FROM internal_controls")) {
      const [key] = bindings as [string];
      if (this.internalControls.has(key)) {
        return { control_key: key } as T;
      }
      return null;
    }

    return null;
  }

  async all<T>(query: string, bindings: Array<string | number>) {
    if (query.includes("FROM workflow_steps")) {
      const [executionId] = bindings as [string];
      const steps = (this.workflowSteps.get(executionId) ?? []).sort(
        (a, b) => a.order - b.order,
      );
      return {
        results: steps.map((step) => ({
          step_id: step.stepId,
          action: step.action,
          status: step.status,
          attempts: step.attempts,
          output_json: step.outputJson,
          error: step.error,
          started_at: step.startedAt,
          completed_at: step.completedAt,
          duration_ms: step.durationMs,
        })),
      } as T;
    }

    if (query.includes("FROM policy_templates ORDER BY")) {
      const results = Array.from(this.policyTemplates.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => ({
          key,
          name: value.name,
          format: value.format,
          body: value.body,
        }));
      return { results } as T;
    }

    if (query.includes("FROM internal_controls c")) {
      const [tenantId, framework] = bindings as [string, string];
      const results = Array.from(this.internalControls.entries())
        .filter(([, value]) => value.framework === framework)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => ({
          key,
          title: value.title,
          evidence_count:
            this.controlEvidence.get(key)?.get(tenantId)?.size ?? 0,
        }));
      return { results } as T;
    }

    if (query.includes("FROM evidence_index")) {
      const limit = Number(bindings[bindings.length - 1]);
      const values = bindings.slice(0, bindings.length - 1);
      const conditions: {
        tenant?: string;
        pack?: string;
        subject?: string;
        cursor?: number;
      } = {};
      let idx = 0;
      if (query.includes("tenant_id = ?")) {
        conditions.tenant = String(values[idx++]);
      }
      if (query.includes("pack = ?")) {
        conditions.pack = String(values[idx++]);
      }
      if (query.includes("subject_ref = ?")) {
        conditions.subject = String(values[idx++]);
      }
      if (query.includes("id < ?")) {
        conditions.cursor = Number(values[idx++]);
      }

      let rows = Array.from(this.evidenceById.values()).sort(
        (a, b) => b.id - a.id,
      );
      if (conditions.tenant)
        rows = rows.filter((row) => row.tenantId === conditions.tenant);
      if (conditions.pack)
        rows = rows.filter((row) => row.pack === conditions.pack);
      if (conditions.subject)
        rows = rows.filter((row) => row.subject === conditions.subject);
      if (conditions.cursor)
        rows = rows.filter((row) => row.id < (conditions.cursor as number));
      rows = rows.slice(0, limit);
      return {
        results: rows.map((row) => ({
          id: row.id,
          hash: row.hash,
          tenant_id: row.tenantId,
          pack: row.pack,
          subject_ref: row.subject,
          created_at: row.createdAt,
        })),
      } as T;
    }

    return { results: [] } as T;
  }
}

type TestEnv = {
  atlasit_compliance: MockD1Database;
  atlasit_evidence: MockR2Bucket;
  API_TOKENS: MockKVNamespace;
  BUILD_VERSION: string;
  RETENTION_DAYS_POLICIES?: string;
};

function createEnv(): TestEnv {
  return {
    atlasit_compliance: new MockD1Database(),
    atlasit_evidence: new MockR2Bucket(),
    API_TOKENS: new MockKVNamespace(),
    BUILD_VERSION: "test",
  };
}

async function invoke(
  env: TestEnv,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type"))
    headers.set("content-type", "application/json");
  const req = new Request(`https://example.com${path}`, {
    ...init,
    headers,
  });
  return (worker as any).fetch(req, env);
}

describe("compliance automation integration (red)", () => {
  let env: TestEnv;
  let tenantKey: string;
  let otherKey: string;

  beforeEach(async () => {
    env = createEnv();
    tenantKey = "tenant-alpha";
    otherKey = "tenant-beta";
    const tenantHash = await sha256Hex(tenantKey);
    const otherHash = await sha256Hex(otherKey);
    await env.API_TOKENS.put(
      `token:${tenantHash}`,
      JSON.stringify({
        tenantId: "tenant-alpha",
        roles: ["automation:execute", "policies:manage"],
      }),
    );
    await env.API_TOKENS.put(
      `token:${otherHash}`,
      JSON.stringify({
        tenantId: "tenant-beta",
        roles: ["automation:execute", "policies:manage"],
      }),
    );
  });

  function authHeaders(key: string, extra: Record<string, string> = {}) {
    return {
      "x-api-key": key,
      ...extra,
    } as Record<string, string>;
  }

  it("executes joiner workflow and persists step outputs", async () => {
    const res = await invoke(env, "/api/v1/workflows/execute", {
      method: "POST",
      headers: authHeaders(tenantKey),
      body: JSON.stringify({ type: "joiner", subjectRef: "user-join" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.execution).toBeDefined();
    expect(body.execution.type).toBe("joiner");
    expect(Array.isArray(body.execution.steps)).toBe(true);
    expect(body.execution.steps).toHaveLength(4);
    const detail = await invoke(
      env,
      `/api/v1/workflows/executions/${body.execution.id}`,
      {
        method: "GET",
        headers: authHeaders(tenantKey),
      },
    );
    expect(detail.status).toBe(200);
  });

  it("enforces idempotency on workflow execution requests", async () => {
    const body = JSON.stringify({ type: "joiner", subjectRef: "user-dup" });
    const first = await invoke(env, "/api/v1/workflows/execute", {
      method: "POST",
      headers: authHeaders(tenantKey, { "Idempotency-Key": "dup-1" }),
      body,
    });
    const second = await invoke(env, "/api/v1/workflows/execute", {
      method: "POST",
      headers: authHeaders(tenantKey, { "Idempotency-Key": "dup-1" }),
      body,
    });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstBody = await first.json();
    const secondBody = await second.json();
    expect(firstBody.execution.id).toBe(secondBody.execution.id);
    expect(secondBody.meta?.idempotentHit).toBe(true);
  });

  it("prevents cross-tenant access to workflow executions", async () => {
    const created = await invoke(env, "/api/v1/workflows/execute", {
      method: "POST",
      headers: authHeaders(tenantKey),
      body: JSON.stringify({ type: "mover", subjectRef: "user-shared" }),
    });
    expect(created.status).toBe(200);
    const executionBody = await created.json();
    const executionId = executionBody.execution.id;
    const attempted = await invoke(
      env,
      `/api/v1/workflows/executions/${executionId}`,
      {
        method: "GET",
        headers: authHeaders(otherKey),
      },
    );
    expect(attempted.status).toBe(404);
  });

  it("lists policy templates and generates policies deterministically", async () => {
    const list = await invoke(env, "/api/v1/policies/templates", {
      headers: authHeaders(tenantKey),
    });
    expect(list.status).toBe(200);
    const listed = await list.json();
    expect(Array.isArray(listed.templates)).toBe(true);
    expect(listed.templates.length).toBeGreaterThan(0);

    const generate = await invoke(env, "/api/v1/policies/generate", {
      method: "POST",
      headers: authHeaders(tenantKey),
      body: JSON.stringify({
        templateKey: "soc2.demo",
        input: { tenant: "tenant-alpha" },
      }),
    });
    expect(generate.status).toBe(200);
    const generated = await generate.json();
    expect(generated.hash).toMatch(/^[a-f0-9]{64}$/);
    const repeat = await invoke(env, "/api/v1/policies/generate", {
      method: "POST",
      headers: authHeaders(tenantKey),
      body: JSON.stringify({
        templateKey: "soc2.demo",
        input: { tenant: "tenant-alpha" },
      }),
    });
    const repeatBody = await repeat.json();
    expect(repeatBody.hash).toBe(generated.hash);
  });

  it("evaluates policies with deterministic hashing", async () => {
    const payload = { policyKey: "soc2.demo", input: { control: "CC1" } };
    const first = await invoke(env, "/api/v1/policy/evaluate", {
      method: "POST",
      headers: authHeaders(tenantKey),
      body: JSON.stringify(payload),
    });
    const second = await invoke(env, "/api/v1/policy/evaluate", {
      method: "POST",
      headers: authHeaders(tenantKey),
      body: JSON.stringify(payload),
    });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstEval = await first.json();
    const secondEval = await second.json();
    expect(firstEval.hash).toBe(secondEval.hash);
    expect(secondEval.meta?.deterministic).toBe(true);
  });

  it("reports framework coverage with evidence linkage", async () => {
    const ingest = await invoke(env, "/api/evidence/ingest", {
      method: "POST",
      headers: authHeaders(tenantKey),
      body: JSON.stringify({
        tenantId: "tenant-alpha",
        pack: "SOC2_CC1.1_base",
        subject: "user-join",
        payload: {
          control: "CC1.1",
          timestamp: "2025-05-20T00:00:00.000Z",
          result: { compliant: true },
        },
      }),
    });
    expect(ingest.status).toBe(200);
    const coverage = await invoke(
      env,
      "/api/v1/policies/coverage?framework=SOC2",
      {
        headers: authHeaders(tenantKey),
      },
    );
    expect(coverage.status).toBe(200);
    const summary = await coverage.json();
    expect(Array.isArray(summary.controls)).toBe(true);
  });

  it("verifies evidence integrity and purges expired generated policies", async () => {
    const envelope = {
      tenantId: "tenant-alpha",
      pack: "SOC2_CC2.2_base",
      subject: "leaver-123",
      payload: {
        control: "CC2.2",
        timestamp: "2025-04-01T00:00:00.000Z",
        result: { compliant: true },
      },
    };
    const ingest = await invoke(env, "/api/evidence/ingest", {
      method: "POST",
      headers: authHeaders(tenantKey),
      body: JSON.stringify(envelope),
    });
    expect(ingest.status).toBe(200);
    const { hash } = await ingest.json();
    const verify = await invoke(env, `/api/v1/evidence/${hash}/verify`, {
      headers: authHeaders(tenantKey),
    });
    expect(verify.status).toBe(200);
    const verification = await verify.json();
    expect(verification.valid).toBe(true);

    const purge = await invoke(env, "/api/v1/admin/retention/policies/purge", {
      method: "POST",
      headers: authHeaders(tenantKey),
    });
    expect(purge.status).toBe(200);
  });

  it("augments health report with automation and policy metrics", async () => {
    const health = await invoke(env, "/health");
    expect(health.status).toBe(200);
    const body = await health.json();
    expect(body).toHaveProperty("automation");
    expect(body.automation).toHaveProperty("executions24h");
    expect(body).toHaveProperty("latency");
    expect(body.latency).toHaveProperty("workflowExecute");
  });
});
