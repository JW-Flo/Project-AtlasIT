/**
 * JML (Joiner/Mover/Leaver) API routes.
 *
 * These endpoints expose the zero-config JML engine for:
 * - Policy management (GET/PUT tenant JML settings)
 * - Manual JML trigger (for testing or manual runs)
 * - Changelog viewing
 * - Workflow run status
 */

import { Hono } from "hono";
import { requireRole } from "@atlasit/shared";
import type { AppEnv } from "../types";
import {
  classifyAndExecute,
  loadJmlPolicy,
  upsertJmlPolicy,
  type DirectoryChange,
  type JmlPolicy,
} from "../lib/jml-engine";

export const jmlRoutes = new Hono<AppEnv>();

// ── Policy management ───────────────────────────────────────────────────────

/** GET /api/v1/jml/policy — fetch tenant JML policy */
jmlRoutes.get("/policy", async (c) => {
  const tenantId = c.get("tenantId");
  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;
  const policy = await loadJmlPolicy(db, tenantId);

  return c.json({
    status: "success",
    data: policy,
    correlationId: c.get("correlationId"),
  });
});

/** PUT /api/v1/jml/policy — update tenant JML policy */
jmlRoutes.put("/policy", requireRole("admin"), async (c) => {
  const tenantId = c.get("tenantId");
  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;
  const body = await c.req.json<Partial<JmlPolicy>>();

  const current = await loadJmlPolicy(db, tenantId);
  const updated: JmlPolicy = {
    ...current,
    ...body,
    tenantId, // never allow override
  };

  await upsertJmlPolicy(db, updated);

  return c.json({
    status: "success",
    data: updated,
    correlationId: c.get("correlationId"),
  });
});

// ── Manual JML trigger ──────────────────────────────────────────────────────

/** POST /api/v1/jml/trigger — manually trigger JML for a user */
jmlRoutes.post("/trigger", requireRole("member"), async (c) => {
  const tenantId = c.get("tenantId");
  const body = await c.req.json<{
    userId: string;
    email?: string;
    changeType: DirectoryChange["changeType"];
    delta?: Record<string, { old?: unknown; new?: unknown }>;
  }>();

  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;
  const adapterUrls = parseAdapterUrls(c.env.ADAPTER_URLS);

  const result = await classifyAndExecute(
    tenantId,
    {
      userId: body.userId,
      email: body.email,
      changeType: body.changeType,
      delta: body.delta ?? {},
      source: "manual_trigger",
    },
    {
      db,
      workflow: c.env.WORKFLOW,
      adapterUrls,
      selfUrl: c.env.SELF_URL,
    },
  );

  if (!result) {
    return c.json({
      status: "success",
      data: { triggered: false, reason: "No JML action applicable" },
      correlationId: c.get("correlationId"),
    });
  }

  return c.json(
    {
      status: "success",
      data: {
        triggered: true,
        action: result.action,
        workflowRunId: result.workflowRunId,
      },
      correlationId: c.get("correlationId"),
    },
    201,
  );
});

// ── Changelog ───────────────────────────────────────────────────────────────

/** GET /api/v1/jml/changelog — list directory change log entries */
jmlRoutes.get("/changelog", async (c) => {
  const tenantId = c.get("tenantId");
  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);
  const action = c.req.query("action"); // joiner | leaver | mover | rehire

  let query = "SELECT * FROM directory_changelog WHERE tenant_id = ?";
  const params: unknown[] = [tenantId];

  if (action) {
    query += " AND jml_action = ?";
    params.push(action);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all();

  return c.json({
    status: "success",
    data: results ?? [],
    meta: { limit, offset },
    correlationId: c.get("correlationId"),
  });
});

// ── Workflow runs ───────────────────────────────────────────────────────────

/** GET /api/v1/jml/runs — list JML workflow runs */
jmlRoutes.get("/runs", async (c) => {
  const tenantId = c.get("tenantId");
  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const status = c.req.query("status");
  const type = c.req.query("type");

  let query = "SELECT * FROM workflow_runs WHERE tenant_id = ?";
  const params: unknown[] = [tenantId];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY started_at DESC LIMIT ?";
  params.push(limit);

  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all();

  return c.json({
    status: "success",
    data: results ?? [],
    correlationId: c.get("correlationId"),
  });
});

/** GET /api/v1/jml/runs/:id — get workflow run detail (from DO + D1) */
jmlRoutes.get("/runs/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const { id } = c.req.param();
  const db = c.env.ATLAS_SHARED_DB ?? c.env.DB;

  // D1 record
  const run = await db
    .prepare("SELECT * FROM workflow_runs WHERE id = ? AND tenant_id = ?")
    .bind(id, tenantId)
    .first();

  if (!run) {
    return c.json(
      { status: "error", code: "NOT_FOUND", message: "Run not found" },
      404,
    );
  }

  // Live state from WorkflowDO
  let liveState = null;
  try {
    const doId = c.env.WORKFLOW.idFromName(id);
    const stub = c.env.WORKFLOW.get(doId);
    const res = await stub.fetch(new Request("http://workflow/status"));
    if (res.ok) {
      liveState = await res.json();
    }
  } catch {
    // DO may not exist yet or may have expired
  }

  return c.json({
    status: "success",
    data: { run, liveState },
    correlationId: c.get("correlationId"),
  });
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseAdapterUrls(val?: string): Record<string, string> {
  if (!val) return {};
  try {
    return JSON.parse(val) as Record<string, string>;
  } catch {
    return {};
  }
}
