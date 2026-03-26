// Canonical implementation — keep in sync with packages/shared/src/events/publisher.ts

import { signPayload } from "../../../packages/shared/src/crypto/hmac.js";

export interface PublishEventOptions {
  orchestratorUrl: string;
  tenantId: string;
  type: string;
  source: string;
  payload?: unknown;
  idempotencyKey?: string;
  correlationId?: string;
  /** HMAC secret for signing the request body (EVENT_PUBLISH_SECRET). */
  secret?: string;
}

export async function publishEvent(
  options: PublishEventOptions,
): Promise<{ id: string; status: string }> {
  const body = JSON.stringify({
    tenantId: options.tenantId,
    type: options.type,
    source: options.source,
    payload: options.payload,
    idempotencyKey: options.idempotencyKey,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.correlationId) {
    headers["X-Correlation-ID"] = options.correlationId;
  }

  if (options.secret) {
    headers["X-Signature"] = await signPayload(body, options.secret);
  }

  const response = await fetch(`${options.orchestratorUrl}/api/v1/events`, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Event publish failed (${response.status}): ${error}`);
  }

  const result = (await response.json()) as {
    data: { id: string; status: string };
  };
  return result.data;
}
