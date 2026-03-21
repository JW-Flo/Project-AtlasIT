import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware as sharedAuthMiddleware } from "@atlasit/shared";
import type { MiddlewareHandler } from "hono";
import type { AppEnv, Bindings } from "./types";
import { eventRoutes } from "./routes/events";
import { agentRoutes } from "./routes/agents";
import { healthRoute } from "./routes/health";
import { workflowRoutes } from "./routes/workflows";
import { deadLetterRoutes } from "./routes/dead-letter";
import { automationRoutes } from "./routes/automation";
import { jmlRoutes } from "./routes/jml";
import { streamRoutes } from "./routes/stream";
import { evaluateAutomationRules, type ActionContext } from "./lib/automation-evaluator";
import { executeStepTask } from "./lib/step-executor";
import { registerBuiltinHandlers } from "./lib/handler-registry";
import { processExpiredCampaigns } from "./lib/access-review-auto-revoke";
import { collectAllAdapterEvidence, parseControlRef } from "@atlasit/shared";

// Register built-in step handlers at module load
registerBuiltinHandlers();

/**
 * Fail fast at request time if required bindings are absent.
 * This surfaces misconfigured deployments immediately rather than producing
 * opaque 500s deep inside a handler.
 */
function validateEnv(env: Bindings): void {
  const required: [keyof Bindings, string][] = [
    ["ATLAS_SHARED_DB", "D1 shared database binding"],
    ["WORKFLOW", "WorkflowDO Durable Object namespace"],
    ["EVIDENCE", "R2 evidence bucket binding"],
  ];
  const missing = required.filter(([key]) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required bindings: ${missing.map(([k, d]) => `${k} (${d})`).join(", ")}`,
    );
  }
  if (!env.EVENT_SOURCE_SECRETS) {
    console.warn("EVENT_SOURCE_SECRETS not set — event signature verification disabled");
  }
}

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: ["https://console.atlasit.pro", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Tenant-ID", "X-Correlation-ID"],
  }),
);

// Correlation ID
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

// Auth middleware on API routes (health stays public).
// Thin wrapper: delegates to shared authMiddleware when API keys are configured,
// sets tenantId from header when no keys are configured (dev/unconfigured).
const apiAuth: MiddlewareHandler = async (c, next) => {
  const allowedKeys = ((c.env as Record<string, string>).API_ALLOWED_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (allowedKeys.length > 0 || c.req.header("Authorization")?.startsWith("Bearer ")) {
    return sharedAuthMiddleware({ allowApiKey: true })(c, next);
  }
  // No API keys configured and no Bearer token — pass through with default tenant
  const tenantId = c.req.header("X-Tenant-ID") ?? "default";
  c.set("tenantId", tenantId);
  c.set("auth", {
    tenantId,
    userId: "",
    email: "",
    roles: ["admin"],
    tokenType: "api-key" as const,
  });
  await next();
};
app.use("/api/*", apiAuth);

// Error handler
app.onError((err, c) => {
  const correlationId = c.get("correlationId") ?? crypto.randomUUID();
  console.error(
    JSON.stringify({
      level: "error",
      correlationId,
      message: err.message,
      stack: err.stack,
    }),
  );
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = err.message;

  if (err.name === "AuthError" && "status" in err) {
    status = (err as any).status;
    code = status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
    message = err.message;
  }

  return c.json(
    {
      status: "error",
      code,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    status as any,
  );
});

app.route("/", healthRoute);
app.route("/api/v1/events", eventRoutes);
app.route("/api/v1/agents", agentRoutes);
app.route("/api/v1/workflows", workflowRoutes);
app.route("/api/v1/dead-letter", deadLetterRoutes);
app.route("/api/v1/automation", automationRoutes);
app.route("/api/v1/jml", jmlRoutes);
app.route("/api/v1/stream", streamRoutes);

export { WorkflowDO } from "./workflow/workflow-do";
export { AutomationDO } from "./automation/automation-do";
export { app };

// ---------------------------------------------------------------------------
// Queue consumer handler for step-result messages
// ---------------------------------------------------------------------------

interface StepResultMessage {
  kind: "step-result";
  runId: string;
  stepId: string;
  attempt: number;
  success: boolean;
  output?: unknown;
  error?: string;
}

interface StepTaskMessage {
  kind: "step-task";
  runId: string;
  stepId: string;
  attempt: number;
  compensation?: boolean;
}

type AnyStepMessage = StepResultMessage | StepTaskMessage;

interface QueueMessage<T = unknown> {
  body: T;
  ack(): void;
  retry(): void;
}

interface QueueBatch<T = unknown> {
  messages: QueueMessage<T>[];
}

const worker = {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext): Response | Promise<Response> {
    validateEnv(env);
    return app.fetch(request, env, ctx);
  },
  async scheduled(event: { cron: string }, env: AppEnv["Bindings"]): Promise<void> {
    const sharedDb = env.ATLAS_SHARED_DB ?? env.DB;

    // ── Duty 1: Evaluate scheduled automation rules ────────────────────────
    const { results } = await sharedDb
      .prepare(
        "SELECT tenant_id FROM automation_rules WHERE trigger_type = 'schedule' AND enabled = 1",
      )
      .all<{ tenant_id: string }>();

    const adapterUrls = (() => {
      try {
        return JSON.parse(env.ADAPTER_URLS ?? "{}") as Record<string, string>;
      } catch {
        return {};
      }
    })();
    const actionContext: ActionContext = {
      workflow: env.WORKFLOW,
      selfUrl: env.SELF_URL,
      adapterUrls,
      sharedDb,
    };

    const automationSettled = await Promise.allSettled([
      ...(results ?? []).map((row) =>
        evaluateAutomationRules(
          sharedDb,
          row.tenant_id,
          "schedule",
          "cron",
          { scheduledAt: new Date().toISOString(), cron: event.cron },
          env.AUTOMATION,
          actionContext,
        ),
      ),
      processExpiredCampaigns({ sharedDb, adapterUrls, evidenceBucket: env.EVIDENCE }),
    ]);

    // ── Duty 2: Scheduled evidence collection from adapters ────────────────
    //    Collect compliance evidence from connected adapters for all tenants
    //    and write to compliance_evidence in D1.
    let evidenceCollected = 0;
    if (Object.keys(adapterUrls).length > 0) {
      // Get distinct tenant IDs from tenants table
      const { results: tenantRows } = await sharedDb
        .prepare("SELECT DISTINCT id FROM tenants LIMIT 100")
        .all<{ id: string }>();

      const collectSettled = await Promise.allSettled(
        (tenantRows ?? []).map(async (row) => {
          const adapterResults = await collectAllAdapterEvidence(adapterUrls, row.id);
          let rowsWritten = 0;
          for (const result of adapterResults) {
            for (const item of result.items) {
              for (const controlRef of item.controlRefs) {
                const { framework, controlId } = parseControlRef(controlRef);
                try {
                  await sharedDb
                    .prepare(
                      `INSERT OR IGNORE INTO compliance_evidence
                       (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    )
                    .bind(
                      crypto.randomUUID(),
                      row.id,
                      framework,
                      controlId,
                      controlRef,
                      "adapter_pull",
                      `adapter:${result.slug}`,
                      `${result.slug}:${item.type}`,
                      "system",
                      null,
                      JSON.stringify({
                        evidenceType: item.type,
                        status: item.status,
                        details: item.details,
                        collectedAt: result.collectedAt,
                      }),
                      new Date().toISOString(),
                    )
                    .run();
                  rowsWritten++;
                } catch {
                  // duplicate or schema not ready — skip
                }
              }
            }
          }
          return rowsWritten;
        }),
      );

      for (const r of collectSettled) {
        if (r.status === "fulfilled") evidenceCollected += r.value;
      }
    }

    // ── Duty 3: Trigger score recalculation after evidence collection ──────
    //    When new evidence was collected, call the compliance-worker to
    //    re-evaluate controls so scores stay fresh.
    let scoresRefreshed = 0;
    const complianceWorkerUrl = env.COMPLIANCE_WORKER_URL;
    const isDaily = event.cron === "0 2 * * *";

    // Trigger recalculation when evidence was collected OR on the daily cron
    if (complianceWorkerUrl && (evidenceCollected > 0 || isDaily)) {
      const { results: allTenants } = await sharedDb
        .prepare("SELECT DISTINCT id FROM tenants LIMIT 100")
        .all<{ id: string }>();

      const scoringFrameworks = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"];
      const scoreSettled = await Promise.allSettled(
        (allTenants ?? []).map(async (row) => {
          let refreshed = 0;
          for (const fw of scoringFrameworks) {
            try {
              await fetch(
                `${complianceWorkerUrl}/api/v1/cdt/evaluate?framework=${encodeURIComponent(fw)}`,
                { headers: { "x-tenant-id": row.id } },
              );
              refreshed++;
            } catch {
              // best-effort — compliance-worker may be unavailable
            }
          }
          return refreshed;
        }),
      );

      for (const r of scoreSettled) {
        if (r.status === "fulfilled") scoresRefreshed += r.value;
      }
    }

    // ── Duty 4: Self health-check (replaces scheduler-worker monitor) ──────
    const checks: Record<string, { status: string; ms: number }> = {};
    const d1Start = Date.now();
    try {
      await sharedDb.prepare("SELECT 1").first();
      checks.d1 = { status: "pass", ms: Date.now() - d1Start };
    } catch {
      checks.d1 = { status: "fail", ms: Date.now() - d1Start };
    }
    const kvStart = Date.now();
    try {
      await env.TASKS.get("__health__");
      checks.kv = { status: "pass", ms: Date.now() - kvStart };
    } catch {
      checks.kv = { status: "fail", ms: Date.now() - kvStart };
    }

    const automationFailures = automationSettled.filter((r) => r.status === "rejected").length;

    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: automationFailures > 0 || checks.d1.status === "fail" ? "warn" : "info",
        event: "cron.complete",
        cron: event.cron,
        isDaily,
        tenantsEvaluated: results?.length ?? 0,
        automationFailures,
        evidenceCollected,
        scoresRefreshed,
        checks,
      }),
    );
  },
  async queue(batch: QueueBatch<AnyStepMessage>, env: AppEnv["Bindings"]): Promise<void> {
    for (const message of batch.messages) {
      const msg = message.body;

      // ── step-task: dispatch to adapter, report back to WorkflowDO ──────────
      if (msg.kind === "step-task") {
        try {
          await executeStepTask(msg, {
            WORKFLOW: env.WORKFLOW,
            ADAPTER_URLS: env.ADAPTER_URLS,
            EVIDENCE: env.EVIDENCE,
          });
          message.ack();
        } catch {
          // WorkflowDO unreachable — retry the message
          message.retry();
        }
        continue;
      }

      // ── step-result: forward outcome to WorkflowDO ──────────────────────────
      if (msg.kind !== "step-result") {
        message.ack();
        continue;
      }

      try {
        const doId = env.WORKFLOW.idFromName(msg.runId);
        const stub = env.WORKFLOW.get(doId);

        const endpoint = msg.success
          ? `http://workflow/step/${msg.stepId}/complete`
          : `http://workflow/step/${msg.stepId}/fail`;

        const body = msg.success
          ? JSON.stringify({ output: msg.output })
          : JSON.stringify({ error: msg.error ?? "Unknown error" });

        const response = await stub.fetch(
          new Request(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }),
        );

        if (response.ok || response.status === 409) {
          message.ack();
        } else {
          message.retry();
        }
      } catch {
        message.retry();
      }
    }
  },
};

export default worker;
