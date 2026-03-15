export async function publishEvent(
  orchestratorUrl: string,
  tenantId: string,
  type: string,
  source: string,
  payload: unknown,
  correlationId?: string,
): Promise<void> {
  const response = await fetch(`${orchestratorUrl}/api/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(correlationId ? { "X-Correlation-ID": correlationId } : {}),
    },
    body: JSON.stringify({
      tenantId,
      type,
      source,
      payload,
      idempotencyKey: `${tenantId}:${type}:${Date.now()}`,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Event publish failed (${response.status}): ${error}`);
  }
}
