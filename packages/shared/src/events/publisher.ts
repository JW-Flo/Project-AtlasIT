export interface PublishEventOptions {
  orchestratorUrl: string;
  tenantId: string;
  type: string;
  source: string;
  payload?: unknown;
  idempotencyKey?: string;
  correlationId?: string;
}

export async function publishEvent(
  options: PublishEventOptions,
): Promise<{ id: string; status: string }> {
  const response = await fetch(`${options.orchestratorUrl}/api/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.correlationId
        ? { "X-Correlation-ID": options.correlationId }
        : {}),
    },
    body: JSON.stringify({
      tenantId: options.tenantId,
      type: options.type,
      source: options.source,
      payload: options.payload,
      idempotencyKey: options.idempotencyKey,
    }),
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
