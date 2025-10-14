# Workflow Persistence Implementation Plan

Last Updated: 2025-10-14
Status: Design Proposal v1.0
Owner: Platform Engineering
Priority: HIGH (Near-term roadmap item)

## Overview

This document describes the implementation plan for persisting workflow state using Cloudflare KV, replacing the current in-memory Map storage in the AI Orchestrator worker.

## Current State

**Location:** `ai-orchestrator/index.js`

```javascript
// In-memory workflow storage (MVP) keyed by workflow id
const workflows = new Map();

// Create workflow (POST /workflow)
app.post("/workflow", async (c) => {
  // ... validation ...
  workflows.set(id, wf);
  return c.json({ workflow: wf }, 201);
});

// Get workflow (GET /workflow/:id)
app.get("/workflow/:id", (c) => {
  const wf = workflows.get(id);
  // ... return workflow ...
});
```

**Limitations:**

- State lost on worker restart/redeploy
- No persistence across isolates
- Cannot scale horizontally
- No audit trail
- Limited storage (memory-bound)

## Target State

**Storage:** Cloudflare KV with TTL-based expiration and optional D1 archival

**Benefits:**

- Persistent storage across deployments
- Scalable across multiple isolates
- Configurable retention periods
- Audit capability through D1 archival
- Performance optimized with edge caching

## Design

### KV Schema

**Namespace:** `WORKFLOW_STORE` (new binding)

**Key Pattern:** `workflow:{workflowId}`

**Value Structure:**

```json
{
  "id": "uuid",
  "tenantId": "tenant-123",
  "name": "workflow-name",
  "steps": [
    {
      "id": "step-1",
      "type": "api_call",
      "config": {...},
      "status": "pending"
    }
  ],
  "status": "pending",
  "createdAt": "2025-10-14T08:00:00.000Z",
  "updatedAt": "2025-10-14T08:00:00.000Z",
  "createdBy": "api-key-hash",
  "metadata": {
    "requestId": "correlation-id",
    "source": "api",
    "version": 1
  }
}
```

**TTL:** 30 days (configurable via `WORKFLOW_TTL_SECONDS` env var)

### Index Keys (for listing)

**Pattern:** `workflow:tenant:{tenantId}:list`

**Value:** JSON array of workflow IDs (limited to most recent 100)

```json
{
  "tenantId": "tenant-123",
  "workflows": ["uuid-1", "uuid-2", ...],
  "lastUpdated": "2025-10-14T08:00:00.000Z",
  "count": 42
}
```

**TTL:** 1 day (rebuilds automatically)

### Status Index

**Pattern:** `workflow:status:{status}:list`

**Value:** JSON array of workflow IDs by status

```json
{
  "status": "pending",
  "workflows": ["uuid-1", "uuid-2", ...],
  "count": 15
}
```

**TTL:** 1 hour

## Implementation Plan

### Phase 1: KV Binding Setup (Week 1)

**Tasks:**

1. Create KV namespace

   ```bash
   wrangler kv:namespace create "WORKFLOW_STORE" --preview
   wrangler kv:namespace create "WORKFLOW_STORE"
   ```

2. Update `wrangler.toml`

   ```toml
   [[env.core.kv_namespaces]]
   binding = "WORKFLOW_STORE"
   id = "<kv-namespace-id>"
   ```

3. Add environment validation
   ```javascript
   // In ai-orchestrator/index.js
   const workflowKv = env.WORKFLOW_STORE;
   if (!workflowKv || typeof workflowKv.get !== "function") {
     log("warn", "orchestrator.workflow_kv_missing", {});
     // Fallback to in-memory for backward compatibility
   }
   ```

**Exit Criteria:**

- [ ] KV namespace created
- [ ] Binding configured in wrangler.toml
- [ ] Health endpoint reports KV binding status
- [ ] Tests verify binding presence

---

### Phase 2: Persistence Layer (Week 1-2)

**Tasks:**

1. Create workflow storage abstraction

   **File:** `ai-orchestrator/workflow-store.js`

   ```javascript
   /**
    * Workflow persistence abstraction
    * Falls back to in-memory Map if KV unavailable
    */

   const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

   export class WorkflowStore {
     constructor(kv, ttlSeconds = DEFAULT_TTL_SECONDS) {
       this.kv = kv;
       this.ttl = ttlSeconds;
       this.memoryFallback = new Map(); // Fallback for development
     }

     async save(workflow) {
       const key = `workflow:${workflow.id}`;
       const value = JSON.stringify({
         ...workflow,
         updatedAt: new Date().toISOString(),
       });

       if (this.kv && typeof this.kv.put === "function") {
         await this.kv.put(key, value, {
           expirationTtl: this.ttl,
           metadata: {
             tenantId: workflow.tenantId,
             status: workflow.status,
             createdAt: workflow.createdAt,
           },
         });

         // Update index
         await this.updateIndex(workflow.tenantId, workflow.id, "add");
       } else {
         // Fallback to in-memory
         this.memoryFallback.set(workflow.id, workflow);
       }

       return workflow;
     }

     async get(workflowId) {
       const key = `workflow:${workflowId}`;

       if (this.kv && typeof this.kv.get === "function") {
         const value = await this.kv.get(key, { type: "json" });
         return value;
       } else {
         return this.memoryFallback.get(workflowId);
       }
     }

     async list(tenantId, limit = 100) {
       const indexKey = `workflow:tenant:${tenantId}:list`;

       if (this.kv && typeof this.kv.get === "function") {
         const index = await this.kv.get(indexKey, { type: "json" });
         if (!index) return [];

         // Fetch workflows in parallel (limit to avoid too many requests)
         const workflowIds = index.workflows.slice(0, limit);
         const workflows = await Promise.all(
           workflowIds.map((id) => this.get(id)),
         );

         return workflows.filter(Boolean); // Remove nulls
       } else {
         // Memory fallback: filter by tenantId
         const all = Array.from(this.memoryFallback.values());
         return all.filter((wf) => wf.tenantId === tenantId).slice(0, limit);
       }
     }

     async updateIndex(tenantId, workflowId, operation = "add") {
       if (!this.kv) return; // Skip if no KV

       const indexKey = `workflow:tenant:${tenantId}:list`;
       let index = (await this.kv.get(indexKey, { type: "json" })) || {
         tenantId,
         workflows: [],
         lastUpdated: new Date().toISOString(),
         count: 0,
       };

       if (operation === "add") {
         if (!index.workflows.includes(workflowId)) {
           index.workflows.unshift(workflowId); // Add to front
           index.count = index.workflows.length;
         }
       } else if (operation === "remove") {
         index.workflows = index.workflows.filter((id) => id !== workflowId);
         index.count = index.workflows.length;
       }

       // Keep only most recent 100
       if (index.workflows.length > 100) {
         index.workflows = index.workflows.slice(0, 100);
       }

       index.lastUpdated = new Date().toISOString();

       await this.kv.put(indexKey, JSON.stringify(index), {
         expirationTtl: 24 * 60 * 60, // 1 day
       });
     }

     async delete(workflowId, tenantId) {
       const key = `workflow:${workflowId}`;

       if (this.kv && typeof this.kv.delete === "function") {
         await this.kv.delete(key);
         await this.updateIndex(tenantId, workflowId, "remove");
       } else {
         this.memoryFallback.delete(workflowId);
       }
     }
   }
   ```

2. Update orchestrator endpoints

   ```javascript
   // In ai-orchestrator/index.js
   import { WorkflowStore } from "./workflow-store.js";

   let workflowStore = null; // Lazy initialization

   function getWorkflowStore(env) {
     if (!workflowStore) {
       const ttl = parseInt(env.WORKFLOW_TTL_SECONDS || "2592000", 10);
       workflowStore = new WorkflowStore(env.WORKFLOW_STORE, ttl);
     }
     return workflowStore;
   }

   // Create workflow (POST /workflow)
   app.post("/workflow", async (c) => {
     const actor = c.get("actor");
     const body = await c.req.json().catch(() => ({}));
     const id = body.id || crypto.randomUUID();
     const tenantId = body.tenantId || actor || "default";
     const steps = Array.isArray(body.steps) ? body.steps : [];

     const wf = {
       id,
       tenantId,
       name: body.name || `workflow-${id.substring(0, 6)}`,
       steps,
       status: "pending",
       createdAt: new Date().toISOString(),
       createdBy: actor,
       metadata: {
         requestId: c.get("requestId"),
         source: "api",
         version: 1,
       },
     };

     const store = getWorkflowStore(c.env);
     await store.save(wf);

     return c.json({ workflow: wf, requestId: c.get("requestId"), actor }, 201);
   });

   // Get workflow (GET /workflow/:id)
   app.get("/workflow/:id", async (c) => {
     const id = c.req.param("id");
     const store = getWorkflowStore(c.env);
     const wf = await store.get(id);

     if (!wf) {
       return c.json(
         {
           error: "Workflow not found",
           id,
           requestId: c.get("requestId"),
           actor: c.get("actor"),
         },
         404,
       );
     }

     return c.json({
       workflow: wf,
       requestId: c.get("requestId"),
       actor: c.get("actor"),
     });
   });

   // List workflows (GET /workflows?tenantId=X&limit=N)
   app.get("/workflows", async (c) => {
     const actor = c.get("actor");
     const tenantId = c.req.query("tenantId") || actor || "default";
     const limit = parseInt(c.req.query("limit") || "100", 10);

     const store = getWorkflowStore(c.env);
     const workflows = await store.list(tenantId, limit);

     return c.json({
       workflows,
       count: workflows.length,
       tenantId,
       requestId: c.get("requestId"),
       actor,
     });
   });

   // Update workflow status (PATCH /workflow/:id)
   app.patch("/workflow/:id", async (c) => {
     const id = c.req.param("id");
     const body = await c.req.json().catch(() => ({}));

     const store = getWorkflowStore(c.env);
     const wf = await store.get(id);

     if (!wf) {
       return c.json({ error: "Workflow not found", id }, 404);
     }

     // Update allowed fields
     if (body.status) wf.status = body.status;
     if (body.steps) wf.steps = body.steps;

     await store.save(wf);

     return c.json({
       workflow: wf,
       requestId: c.get("requestId"),
       actor: c.get("actor"),
     });
   });
   ```

**Exit Criteria:**

- [ ] WorkflowStore class implemented with tests
- [ ] Endpoints updated to use WorkflowStore
- [ ] Fallback to in-memory works when KV unavailable
- [ ] Unit tests pass
- [ ] Integration tests pass

---

### Phase 3: Migration & Deployment (Week 2)

**Tasks:**

1. Add feature flag for gradual rollout

   ```bash
   wrangler kv:key put --binding=KV_FEATURE_FLAGS \
     "workflow_persistence_enabled" "true"
   ```

2. Deploy to staging

   ```bash
   cd ai-orchestrator
   wrangler deploy --env staging
   ```

3. Test persistence across deployments

   ```bash
   # Create workflow
   WORKFLOW_ID=$(curl -X POST https://orchestrator-staging.workers.dev/workflow \
     -H "x-api-key: $API_KEY" \
     -d '{"name":"test","steps":[]}' | jq -r '.workflow.id')

   # Redeploy worker
   wrangler deploy --env staging

   # Verify workflow still exists
   curl https://orchestrator-staging.workers.dev/workflow/$WORKFLOW_ID \
     -H "x-api-key: $API_KEY"
   ```

4. Monitor for issues
   - Check error rates
   - Verify latency acceptable
   - Monitor KV operations count

5. Deploy to production
   ```bash
   wrangler deploy --env production
   ```

**Exit Criteria:**

- [ ] Staging deployment successful
- [ ] Persistence verified across deployments
- [ ] Performance acceptable (p95 <100ms for read, <200ms for write)
- [ ] Production deployment successful
- [ ] Smoke tests pass

---

### Phase 4: D1 Archival (Week 3-4, Optional)

For long-term audit and compliance:

**Schema:**

```sql
CREATE TABLE workflow_archive (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  steps TEXT, -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT,
  metadata TEXT, -- JSON
  archived_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_archive_tenant ON workflow_archive(tenant_id, created_at DESC);
CREATE INDEX idx_workflow_archive_status ON workflow_archive(status);
```

**Implementation:**

- Archive completed/failed workflows to D1 after 7 days
- Keep active workflows in KV for performance
- Query D1 for historical analysis
- Retention: 400 days in D1 (per data retention matrix)

---

## Testing Strategy

### Unit Tests

**File:** `ai-orchestrator/workflow-store.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { WorkflowStore } from "./workflow-store";

describe("WorkflowStore", () => {
  let store: WorkflowStore;
  let mockKv: any;

  beforeEach(() => {
    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    store = new WorkflowStore(mockKv, 3600);
  });

  it("saves workflow to KV", async () => {
    const workflow = {
      id: "test-123",
      tenantId: "tenant-1",
      name: "test",
      steps: [],
      status: "pending",
      createdAt: "2025-10-14T08:00:00.000Z",
    };

    await store.save(workflow);

    expect(mockKv.put).toHaveBeenCalledWith(
      "workflow:test-123",
      expect.stringContaining("test-123"),
      expect.objectContaining({ expirationTtl: 3600 }),
    );
  });

  it("retrieves workflow from KV", async () => {
    const workflow = { id: "test-123", name: "test" };
    mockKv.get.mockResolvedValue(workflow);

    const result = await store.get("test-123");

    expect(mockKv.get).toHaveBeenCalledWith("workflow:test-123", {
      type: "json",
    });
    expect(result).toEqual(workflow);
  });

  it("falls back to memory when KV unavailable", async () => {
    const storeNoKv = new WorkflowStore(null);
    const workflow = {
      id: "test-123",
      tenantId: "tenant-1",
      name: "test",
      steps: [],
      status: "pending",
      createdAt: "2025-10-14T08:00:00.000Z",
    };

    await storeNoKv.save(workflow);
    const result = await storeNoKv.get("test-123");

    expect(result).toEqual(expect.objectContaining({ id: "test-123" }));
  });
});
```

### Integration Tests

**File:** `ai-orchestrator/workflow-persistence.integration.test.ts`

Test scenarios:

- Create workflow and verify retrieval
- Update workflow status
- List workflows by tenant
- Verify TTL expiration (with short TTL in test)
- Verify index updates
- Test concurrent workflow creation

---

## Performance Considerations

### Expected Performance

| Operation | KV Latency | Target p95 | Notes                                  |
| --------- | ---------- | ---------- | -------------------------------------- |
| Save      | ~20-50ms   | <100ms     | Write to KV + index update             |
| Get       | ~10-30ms   | <50ms      | Single KV read                         |
| List      | ~50-200ms  | <300ms     | Index read + parallel workflow fetches |
| Delete    | ~20-40ms   | <75ms      | KV delete + index update               |

### Optimization Strategies

1. **Caching Layer** (optional, Phase 2)
   - Cache frequently accessed workflows in memory
   - TTL: 60 seconds
   - Invalidate on update

2. **Batch Operations**
   - Batch index updates when possible
   - Use `Promise.all` for parallel fetches

3. **Index Size Limits**
   - Keep tenant workflow list to most recent 100
   - Archive older workflows to D1

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Revert to previous deployment

   ```bash
   wrangler rollback --message "Reverting workflow persistence"
   ```

2. **Feature Flag**: Disable persistence

   ```bash
   wrangler kv:key put --binding=KV_FEATURE_FLAGS \
     "workflow_persistence_enabled" "false"
   ```

3. **Code Fallback**: Implementation already falls back to in-memory if KV unavailable

---

## Monitoring & Alerts

### Metrics to Track

- `workflow_kv_write_latency_ms` - Histogram of write latencies
- `workflow_kv_read_latency_ms` - Histogram of read latencies
- `workflow_kv_errors_total` - Counter of KV operation errors
- `workflow_kv_fallback_total` - Counter of fallback to in-memory
- `workflow_active_count` - Gauge of active workflows (by status)

### Alerts

| Alert                 | Condition                  | Severity | Action                              |
| --------------------- | -------------------------- | -------- | ----------------------------------- |
| High KV write latency | p95 >200ms for 5min        | Warning  | Investigate KV performance          |
| KV operation failures | >5% error rate             | Critical | Check KV binding, consider rollback |
| Fallback mode active  | >10% requests use fallback | Warning  | Verify KV binding configured        |

---

## Related Documentation

- Roadmap: `docs/roadmap.md` (Near-term item: "Durable workflow persistence")
- SLO: `docs/SLO.md` (Performance targets)
- Data Retention: `docs/DATA_RETENTION_MATRIX.md`

---

## Appendix: Environment Variables

| Variable                       | Default           | Description                       |
| ------------------------------ | ----------------- | --------------------------------- |
| `WORKFLOW_TTL_SECONDS`         | 2592000 (30 days) | KV expiration for workflows       |
| `WORKFLOW_INDEX_LIMIT`         | 100               | Max workflows per tenant in index |
| `WORKFLOW_PERSISTENCE_ENABLED` | true              | Feature flag (KV key)             |

---

**Document Version:** 1.0  
**Next Review:** After Phase 2 completion  
**Owner:** Platform Engineering Team
