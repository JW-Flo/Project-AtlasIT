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
import { directoryRoutes } from "./routes/directory";
import { nhiRoutes } from "./routes/nhi";
import { discoveryRoutes } from "./routes/discovery";
import { evaluateAutomationRules, type ActionContext } from "./lib/automation-evaluator";
import { executeStepTask } from "./lib/step-executor";
import { registerBuiltinHandlers } from "./lib/handler-registry";
import { processExpiredCampaigns } from "./lib/access-review-auto-revoke";
import { processExpiringNhiCredentials } from "./lib/nhi-expiry-processor";
import { syncNhiFromAdapters } from "./lib/nhi-sync";
import { syncDiscoveredApps } from "./lib/discovery-sync";
import {
  collectAllAdapterEvidence,
  parseControlRef,
  collectPlatformStateEvidence,
  analyzeComplianceGaps,
  detectComplianceDrift,
  detectRiskAnomalies,
  buildCdtPayloadFromEvidence,
  flattenAdapterResults,
} from "@atlasit/shared";
import type { DriftEvent } from "@atlasit/shared";

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
  const envRecord = c.env as Record<string, string>;
  const allowedKeys = (envRecord.API_ALLOWED_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (allowedKeys.length > 0 || c.req.header("Authorization")?.startsWith("Bearer ")) {
    return sharedAuthMiddleware({ allowApiKey: true })(c, next);
  }

  // Fail-closed: no API keys configured means reject in production.
  // Only allow dev bypass when ENVIRONMENT is explicitly "development".
  const environment = (envRecord.ENVIRONMENT ?? "").toLowerCase();
  if (environment === "development") {
    const tenantId = c.req.header("X-Tenant-ID") ?? "default";
    c.set("tenantId", tenantId);
    c.set("auth", {
      tenantId,
      userId: "",
      email: "",
      roles: ["admin"],
      tokenType: "api-key" as const,
    });
    return next();
  }

  return c.json(
    {
      status: "error",
      code: "AUTH_NOT_CONFIGURED",
      message: "API authentication is not configured. Set API_ALLOWED_KEYS.",
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    401,
  );
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
app.route("/api/v1/directory", directoryRoutes);
app.route("/api/v1/nhi", nhiRoutes);
app.route("/api/v1/discovery", discoveryRoutes);

export { WorkflowDO } from "./workflow/workflow-do";
export { AtlasWorkflow } from "./workflow/atlas-workflow";
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
      atlasWorkflow: env.ATLAS_WORKFLOW,
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
    const adapterErrorList: { adapter: string; controlRef: string; error: string }[] = [];
    // Capture per-tenant evidence for Duty 2.5 CDT payload construction
    const tenantEvidenceMap = new Map<
      string,
      Array<{
        slug: string;
        items: Array<{
          type: string;
          controlRefs: string[];
          status: "pass" | "fail" | "unknown";
          details: Record<string, unknown>;
        }>;
      }>
    >();
    if (Object.keys(adapterUrls).length > 0) {
      // Get distinct tenant IDs from tenants table
      const { results: tenantRows } = await sharedDb
        .prepare("SELECT DISTINCT id FROM tenants LIMIT 100")
        .all<{ id: string }>();

      const collectSettled = await Promise.allSettled(
        (tenantRows ?? []).map(async (row) => {
          const adapterResults = await collectAllAdapterEvidence(adapterUrls, row.id);
          // Store for Duty 2.5
          tenantEvidenceMap.set(row.id, adapterResults);
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
                } catch (err) {
                  const msg = err instanceof Error ? err.message : String(err);
                  if (!msg.includes("UNIQUE constraint")) {
                    console.error(
                      JSON.stringify({
                        ts: new Date().toISOString(),
                        level: "warn",
                        event: "duty2.evidence_write_failed",
                        tenantId: row.id,
                        adapter: result.slug,
                        controlRef,
                        error: msg,
                      }),
                    );
                    adapterErrorList.push({ adapter: result.slug, controlRef, error: msg });
                  }
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

      // Store error summary for UI visibility
      if (adapterErrorList.length > 0) {
        for (const row of tenantRows ?? []) {
          try {
            const errSummary = JSON.stringify({
              errors: adapterErrorList.slice(0, 20),
              timestamp: new Date().toISOString(),
              total: adapterErrorList.length,
            });
            await sharedDb
              .prepare(
                `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
                 VALUES (?, 'last_evidence_errors', ?, datetime('now'))
                 ON CONFLICT(tenant_id, key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
              )
              .bind(row.id, errSummary, errSummary)
              .run();
          } catch {
            /* best-effort */
          }
        }
      }

      // Persist adapter collection health for each tenant
      const now = new Date().toISOString();
      for (const [tenantId, results] of tenantEvidenceMap) {
        for (const result of results) {
          try {
            await sharedDb
              .prepare(
                `INSERT INTO adapter_collection_health (id, tenant_id, adapter_slug, collected_at, items_count, error)
                 VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?)
                 ON CONFLICT(tenant_id, adapter_slug) DO UPDATE SET
                   collected_at = excluded.collected_at,
                   items_count = excluded.items_count,
                   error = excluded.error`,
              )
              .bind(tenantId, result.slug, now, result.items.length, result.error ?? null)
              .run();
          } catch {
            /* best-effort */
          }
        }
      }
    }

    // ── Duty 2b: Platform state evidence collection ────────────────────────
    //    Scan D1 tables for structural compliance evidence (RBAC configured,
    //    audit logging active, etc.) that demonstrates platform controls.
    let platformEvidenceCollected = 0;
    {
      const { results: tenantRows } = await sharedDb
        .prepare("SELECT DISTINCT id FROM tenants LIMIT 100")
        .all<{ id: string }>();

      const stateSettled = await Promise.allSettled(
        (tenantRows ?? []).map(async (row) => {
          const { evidenceWritten } = await collectPlatformStateEvidence(sharedDb, row.id);
          return evidenceWritten;
        }),
      );

      for (const r of stateSettled) {
        if (r.status === "fulfilled") platformEvidenceCollected += r.value;
      }
      evidenceCollected += platformEvidenceCollected;
    }

    // ── Duty 2.5: Bulk policy evaluation ──────────────────────────────────
    //    Evaluate all 60 CDT boolean rules and store results as
    //    policy_evaluation evidence. This feeds into the scoring pipeline
    //    so policy pass/fail affects control status.
    let policyEvalsTriggered = 0;
    const complianceWorkerUrl = env.COMPLIANCE_WORKER_URL;
    if (complianceWorkerUrl && (evidenceCollected > 0 || event.cron === "0 2 * * *")) {
      const { results: policyTenants } = await sharedDb
        .prepare("SELECT DISTINCT id FROM tenants LIMIT 100")
        .all<{ id: string }>();

      const policySettled = await Promise.allSettled(
        (policyTenants ?? []).map(async (row) => {
          try {
            // Build CDT payload from collected adapter evidence
            const adapterResults = tenantEvidenceMap.get(row.id) ?? [];
            const flatItems = flattenAdapterResults(adapterResults);
            const cdtPayload = buildCdtPayloadFromEvidence(flatItems);
            await fetch(`${complianceWorkerUrl}/api/v1/policies/evaluate-all`, {
              method: "POST",
              headers: { "x-tenant-id": row.id, "content-type": "application/json" },
              body: JSON.stringify({ input: cdtPayload }),
            });
            return 1;
          } catch {
            return 0;
          }
        }),
      );

      for (const r of policySettled) {
        if (r.status === "fulfilled") policyEvalsTriggered += r.value;
      }
    }

    // ── Duty 3: Trigger score recalculation after evidence collection ──────
    //    When new evidence was collected, call the compliance-worker to
    //    re-evaluate controls so scores stay fresh.
    let scoresRefreshed = 0;
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

    // ── Duty 4b: Auto-promote control statuses based on evidence density ───
    //    For each tenant, read compliance_controls from tenant_preferences,
    //    count evidence per framework/control, and promote statuses where
    //    evidence thresholds are met. Never demotes or touches `verified`.
    let controlsPromoted = 0;
    {
      const { results: promotionTenants } = await sharedDb
        .prepare("SELECT DISTINCT id FROM tenants LIMIT 100")
        .all<{ id: string }>();

      const promotionSettled = await Promise.allSettled(
        (promotionTenants ?? []).map(async (row) => {
          // Read the controls blob
          const prefRow = await sharedDb
            .prepare(
              "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'",
            )
            .first<{ value: string }>(row.id);

          if (!prefRow?.value) return 0;

          let controls: Array<Record<string, string>>;
          try {
            controls = JSON.parse(prefRow.value);
          } catch {
            return 0;
          }

          if (!Array.isArray(controls) || controls.length === 0) return 0;

          // Count evidence per framework (coarse) and per control_id (fine)
          const { results: evidenceRows } = await sharedDb
            .prepare(
              "SELECT framework, control_id, COUNT(*) as cnt FROM compliance_evidence WHERE tenant_id = ? GROUP BY framework, control_id",
            )
            .all<{ framework: string; control_id: string; cnt: number }>(row.id);

          // Build maps: framework → total count, control_id → count
          const frameworkTotals = new Map<string, number>();
          const controlIdCounts = new Map<string, number>();
          for (const ev of evidenceRows ?? []) {
            frameworkTotals.set(ev.framework, (frameworkTotals.get(ev.framework) ?? 0) + ev.cnt);
            controlIdCounts.set(ev.control_id, (controlIdCounts.get(ev.control_id) ?? 0) + ev.cnt);
          }

          let promoted = 0;
          const updated = controls.map((control) => {
            const status = control.status ?? "not_started";

            // Never touch verified controls
            if (status === "verified") return control;

            const framework = (control.framework ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
            const frameworkEvidenceCount = (() => {
              // Exact match after normalisation (strip non-alphanumeric, uppercase)
              for (const [fw, cnt] of frameworkTotals) {
                const normFw = fw.toUpperCase().replace(/[^A-Z0-9]/g, "");
                if (normFw === framework) {
                  return cnt;
                }
              }
              return 0;
            })();

            // Fine-grained count for the specific control_id (exact match)
            const controlEvidenceCount = controlIdCounts.get(control.id ?? "") ?? 0;

            if (status === "not_started" && frameworkEvidenceCount > 0) {
              promoted++;
              return { ...control, status: "in_progress" };
            }

            if (status === "in_progress" && controlEvidenceCount >= 3) {
              promoted++;
              return { ...control, status: "implemented" };
            }

            return control;
          });

          if (promoted > 0) {
            await sharedDb
              .prepare(
                "INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, 'compliance_controls', ?)",
              )
              .bind(row.id, JSON.stringify(updated))
              .run();
          }

          return promoted;
        }),
      );

      for (let i = 0; i < promotionSettled.length; i++) {
        const r = promotionSettled[i];
        if (r.status === "fulfilled") {
          controlsPromoted += r.value;
        } else {
          const tenantId = (promotionTenants ?? [])[i]?.id ?? "unknown";
          console.error(
            JSON.stringify({
              ts: new Date().toISOString(),
              level: "error",
              event: "duty4b.promotion_failed",
              tenantId,
              error: r.reason?.message ?? String(r.reason),
            }),
          );
        }
      }
    }

    // ── Duty 6: Compliance intelligence scan ────────────────────────────
    //    Analyze gaps, detect drift, and surface risk anomalies per tenant.
    //    Runs on daily cron or when fresh evidence was collected.
    let insightsWritten = 0;
    if (isDaily || evidenceCollected > 0) {
      const { results: insightTenants } = await sharedDb
        .prepare("SELECT DISTINCT id FROM tenants LIMIT 100")
        .all<{ id: string }>();

      const scoringFrameworks = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"];

      const insightSettled = await Promise.allSettled(
        (insightTenants ?? []).map(async (row) => {
          let written = 0;

          // Gap analysis
          try {
            const gapResult = await analyzeComplianceGaps(sharedDb, row.id, scoringFrameworks);
            const highPriorityGaps = gapResult.gaps.filter(
              (g) => g.priority === "critical" || g.priority === "high",
            );
            for (const gap of highPriorityGaps) {
              try {
                await sharedDb
                  .prepare(
                    `INSERT OR IGNORE INTO compliance_insights
                     (id, tenant_id, insight_type, severity, category, data, created_at)
                     VALUES (?, ?, 'gap', ?, ?, ?, ?)`,
                  )
                  .bind(
                    crypto.randomUUID(),
                    row.id,
                    gap.priority,
                    gap.framework,
                    JSON.stringify(gap),
                    new Date().toISOString(),
                  )
                  .run();
                written++;
              } catch {
                // table may not exist yet — skip
              }
            }
          } catch {
            // gap analysis failed — continue
          }

          // Drift detection
          try {
            const { results: recentEvents } = await sharedDb
              .prepare(
                `SELECT event_type AS type, source, created_at AS timestamp, metadata
                 FROM audit_log
                 WHERE tenant_id = ? AND created_at > datetime('now', '-24 hours')
                   AND event_type IN ('app_disconnected', 'app_health_changed', 'rule_disabled', 'compliance_score_changed')
                 ORDER BY created_at DESC LIMIT 50`,
              )
              .bind(row.id)
              .all<{ type: string; source: string; timestamp: string; metadata: string }>();

            const driftEvents: DriftEvent[] = (recentEvents ?? []).map((e) => ({
              type: e.type,
              source: e.source ?? "",
              timestamp: e.timestamp,
              metadata: (() => {
                try {
                  return JSON.parse(e.metadata ?? "{}");
                } catch {
                  return {};
                }
              })(),
            }));

            if (driftEvents.length > 0) {
              const driftResult = await detectComplianceDrift(sharedDb, row.id, driftEvents);
              for (const alert of driftResult.alerts) {
                try {
                  await sharedDb
                    .prepare(
                      `INSERT OR IGNORE INTO compliance_insights
                       (id, tenant_id, insight_type, severity, category, data, created_at)
                       VALUES (?, ?, 'drift', ?, ?, ?, ?)`,
                    )
                    .bind(
                      alert.id,
                      row.id,
                      alert.severity,
                      alert.alertType,
                      JSON.stringify(alert),
                      new Date().toISOString(),
                    )
                    .run();
                  written++;
                } catch {
                  // skip
                }
              }
            }
          } catch {
            // drift detection failed — continue
          }

          // Risk anomaly detection
          try {
            const anomalies = await detectRiskAnomalies(sharedDb, row.id);
            for (const anomaly of anomalies) {
              try {
                await sharedDb
                  .prepare(
                    `INSERT OR IGNORE INTO compliance_insights
                     (id, tenant_id, insight_type, severity, category, data, created_at)
                     VALUES (?, ?, 'anomaly', ?, ?, ?, ?)`,
                  )
                  .bind(
                    crypto.randomUUID(),
                    row.id,
                    anomaly.severity,
                    anomaly.anomalyType,
                    JSON.stringify(anomaly),
                    new Date().toISOString(),
                  )
                  .run();
                written++;
              } catch {
                // skip
              }
            }
          } catch {
            // anomaly detection failed — continue
          }

          return written;
        }),
      );

      for (const r of insightSettled) {
        if (r.status === "fulfilled") insightsWritten += r.value;
      }
    }

    // ── Duty 5a: NHI credential discovery + sync from adapters ────────────
    //    Discover non-human identities (service accounts, API keys, deploy keys)
    //    from connected adapters and upsert into nhi_credentials.
    let nhiSynced = 0;
    let nhiSyncErrors = 0;
    try {
      const tenantRows = await sharedDb
        .prepare("SELECT DISTINCT tenant_id FROM app_credentials LIMIT 200")
        .all<{ tenant_id: string }>();

      for (const row of tenantRows.results ?? []) {
        try {
          const result = await syncNhiFromAdapters(
            adapterUrls,
            row.tenant_id,
            sharedDb,
            crypto.randomUUID(),
          );
          nhiSynced += result.created + result.updated;
        } catch {
          nhiSyncErrors++;
        }
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          event: "duty5a.nhi_sync_failed",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }

    // ── Duty 5b: Shadow AI / SaaS discovery scan ────────────────────────
    //    Scan OAuth grants from capable adapters, classify discovered apps,
    //    detect shadow AI tools, and create incidents for high-risk grants.
    let discoveryApps = 0;
    let discoveryGrants = 0;
    let discoveryAiTools = 0;
    try {
      const tenantRows = await sharedDb
        .prepare("SELECT DISTINCT tenant_id FROM app_credentials LIMIT 200")
        .all<{ tenant_id: string }>();

      for (const row of tenantRows.results ?? []) {
        try {
          const result = await syncDiscoveredApps(
            adapterUrls,
            row.tenant_id,
            sharedDb,
            crypto.randomUUID(),
          );
          discoveryApps += result.newApps + result.updatedApps;
          discoveryGrants += result.totalGrants;
          discoveryAiTools += result.aiToolsFound;
        } catch {
          // continue to next tenant
        }
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          event: "duty5b.discovery_scan_failed",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }

    // ── Duty 5: NHI token expiry processing ──────────────────────────────
    //    Scan nhi_credentials for tokens expiring within grace period or
    //    already expired. Emit compliance evidence and update statuses.
    let nhiExpirySoon = 0;
    let nhiExpired = 0;
    let nhiRotationPending = 0;
    let nhiIncidentsCreated = 0;
    try {
      const nhiResult = await processExpiringNhiCredentials({ sharedDb });
      nhiExpirySoon = nhiResult.expiringSoon;
      nhiExpired = nhiResult.expired;
      nhiRotationPending = nhiResult.rotationPending;
      nhiIncidentsCreated = nhiResult.incidentsCreated;
    } catch (err) {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          event: "duty5.nhi_expiry_failed",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }

    // ── Duty 7: Incident SLA breach detection + auto-resolve ────────────
    //    Check for incidents past their SLA deadline and emit breach events.
    //    Also resolve incidents flagged for auto-resolution.
    let slaBreach = 0;
    let autoResolved = 0;
    try {
      // Detect SLA breaches
      const breachedRows = await sharedDb
        .prepare(
          `SELECT id, tenant_id, title, severity FROM incidents
           WHERE sla_breach_at <= datetime('now')
             AND status IN ('open', 'investigating')
             AND sla_breach_notified = 0
           LIMIT 500`,
        )
        .all();

      for (const row of breachedRows.results ?? []) {
        const r = row as any;
        try {
          // Mark as notified
          await sharedDb
            .prepare("UPDATE incidents SET sla_breach_notified = 1 WHERE id = ?")
            .bind(r.id)
            .run();

          // Write timeline entry
          const tlId = crypto.randomUUID().replace(/-/g, "");
          await sharedDb
            .prepare(
              `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
               VALUES (?, ?, ?, 'sla_warning', 'system', 'SLA deadline breached')`,
            )
            .bind(tlId, r.id, r.tenant_id)
            .run();

          // Emit event for automation rules to pick up
          const evId = crypto.randomUUID().replace(/-/g, "");
          await sharedDb
            .prepare(
              `INSERT INTO events (id, tenant_id, type, source, payload, status, created_at)
               VALUES (?, ?, 'incident_sla_breached', 'orchestrator', ?, 'pending', datetime('now'))`,
            )
            .bind(
              evId,
              r.tenant_id,
              JSON.stringify({ incidentId: r.id, title: r.title, severity: r.severity }),
            )
            .run();

          slaBreach++;
        } catch {
          // Continue processing other incidents
        }
      }

      // Auto-resolve flagged incidents
      const autoResolveRows = await sharedDb
        .prepare(
          `SELECT id, tenant_id FROM incidents
           WHERE auto_resolve = 1 AND status = 'open'
             AND source = 'automation'
           LIMIT 500`,
        )
        .all();

      for (const row of autoResolveRows.results ?? []) {
        const r = row as any;
        try {
          await sharedDb
            .prepare(
              "UPDATE incidents SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?",
            )
            .bind(r.id)
            .run();

          const tlId = crypto.randomUUID().replace(/-/g, "");
          await sharedDb
            .prepare(
              `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
               VALUES (?, ?, ?, 'auto_action', 'system', 'Incident auto-resolved')`,
            )
            .bind(tlId, r.id, r.tenant_id)
            .run();

          autoResolved++;
        } catch {
          // Continue
        }
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          event: "duty7.sla_check_failed",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
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
        controlsPromoted,
        nhiSynced,
        nhiSyncErrors,
        nhiExpirySoon,
        nhiExpired,
        nhiRotationPending,
        nhiIncidentsCreated,
        discoveryApps,
        discoveryGrants,
        discoveryAiTools,
        insightsWritten,
        slaBreach,
        autoResolved,
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
            DB: (env as any).ATLAS_SHARED_DB ?? (env as any).DB,
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
