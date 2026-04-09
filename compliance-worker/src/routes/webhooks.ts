import type { Env } from "../env";
import { resolveD1 } from "../env";
import { verifyHmacAuth } from "../middleware/hmac-auth";
import { publishEvent } from "../lib/event-publisher";
import { log } from "../log";
import { jsonResponse, errorResponse } from "../http/utils";

interface WebhookRouteContext {
  request: Request;
  env: Env;
  requestId: string;
  headers: Record<string, string>;
  url: URL;
  method: string;
}

export async function webhookRoutes(
  ctx: WebhookRouteContext,
): Promise<Response | null> {
  const { url, method } = ctx;

  if (url.pathname === "/api/v1/webhooks/evidence" && method === "POST") {
    return handleEvidenceWebhook(ctx);
  }

  if (url.pathname === "/api/v1/webhooks/scan-result" && method === "POST") {
    return handleScanResultWebhook(ctx);
  }

  return null;
}

async function handleEvidenceWebhook(
  ctx: WebhookRouteContext,
): Promise<Response> {
  const { request, env, requestId, headers } = ctx;

  const authResult = await verifyHmacAuth(request, env);
  if (!authResult.valid) {
    return jsonResponse(
      { error: authResult.message, requestId },
      authResult.status,
      headers,
    );
  }

  const evidence = authResult.parsedBody as {
    tenantId: string;
    frameworkId: string;
    controlId: string;
    evidenceType: string;
    data: unknown;
    collectedAt: string;
  };

  if (
    !evidence.tenantId ||
    !evidence.frameworkId ||
    !evidence.controlId ||
    !evidence.evidenceType
  ) {
    return errorResponse(
      400,
      requestId,
      headers,
      "Missing required fields: tenantId, frameworkId, controlId, evidenceType",
    );
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(500, requestId, headers, "Database not available");
  }

  const correlationId =
    request.headers.get("X-Correlation-ID") ?? crypto.randomUUID();
  const id = crypto.randomUUID();

  try {
    await db
      .prepare(
        "INSERT OR IGNORE INTO compliance_evidence (id, tenant_id, framework_id, control_id, evidence_type, data, collected_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        evidence.tenantId,
        evidence.frameworkId,
        evidence.controlId,
        evidence.evidenceType,
        JSON.stringify(evidence.data),
        evidence.collectedAt,
      )
      .run();
  } catch (err) {
    log("error", "webhook.evidence.db_error", {
      requestId,
      correlationId,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to store evidence");
  }

  // Publish event to orchestrator (best-effort, non-blocking)
  const orchestratorUrl = (env as Record<string, unknown>).ORCHESTRATOR_URL as
    | string
    | undefined;
  if (orchestratorUrl) {
    publishEvent({
      orchestratorUrl,
      tenantId: evidence.tenantId,
      type: "compliance.evidence.received",
      source: "compliance-worker",
      payload: {
        evidenceId: id,
        frameworkId: evidence.frameworkId,
        controlId: evidence.controlId,
        evidenceType: evidence.evidenceType,
      },
      idempotencyKey: `evidence-${id}`,
      correlationId,
    }).catch((err) => {
      log("error", "webhook.evidence.event_publish_failed", {
        requestId,
        correlationId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  log("info", "webhook.evidence.received", {
    requestId,
    correlationId,
    evidenceId: id,
    tenantId: evidence.tenantId,
    frameworkId: evidence.frameworkId,
    controlId: evidence.controlId,
  });

  return jsonResponse(
    {
      status: "success",
      data: { id, evidenceType: evidence.evidenceType },
      correlationId,
      timestamp: new Date().toISOString(),
    },
    201,
    headers,
  );
}

async function handleScanResultWebhook(
  ctx: WebhookRouteContext,
): Promise<Response> {
  const { request, env, requestId, headers } = ctx;

  const authResult = await verifyHmacAuth(request, env);
  if (!authResult.valid) {
    return jsonResponse(
      { error: authResult.message, requestId },
      authResult.status,
      headers,
    );
  }

  const scanResult = authResult.parsedBody as {
    tenantId: string;
    scanType: string;
    findings: unknown[];
    completedAt: string;
  };

  if (
    !scanResult.tenantId ||
    !scanResult.scanType ||
    !Array.isArray(scanResult.findings)
  ) {
    return errorResponse(
      400,
      requestId,
      headers,
      "Missing required fields: tenantId, scanType, findings",
    );
  }

  const correlationId =
    request.headers.get("X-Correlation-ID") ?? crypto.randomUUID();
  const id = crypto.randomUUID();

  // Publish scan completion event to orchestrator (best-effort, non-blocking)
  const orchestratorUrl = (env as Record<string, unknown>).ORCHESTRATOR_URL as
    | string
    | undefined;
  if (orchestratorUrl) {
    publishEvent({
      orchestratorUrl,
      tenantId: scanResult.tenantId,
      type: "compliance.scan.completed",
      source: "compliance-worker",
      payload: {
        scanId: id,
        scanType: scanResult.scanType,
        findingCount: scanResult.findings.length,
      },
      idempotencyKey: `scan-${id}`,
      correlationId,
    }).catch((err) => {
      log("error", "webhook.scan_result.event_publish_failed", {
        requestId,
        correlationId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  log("info", "webhook.scan_result.received", {
    requestId,
    correlationId,
    scanId: id,
    tenantId: scanResult.tenantId,
    scanType: scanResult.scanType,
    findingCount: scanResult.findings.length,
  });

  return jsonResponse(
    {
      status: "success",
      data: {
        id,
        scanType: scanResult.scanType,
        findingCount: scanResult.findings.length,
      },
      correlationId,
      timestamp: new Date().toISOString(),
    },
    201,
    headers,
  );
}
