export interface DeadLetterEntry {
  eventId: string;
  agentId: string;
  deliveryId: string;
  tenantId: string;
  eventType: string;
  eventSource: string;
  eventPayload?: string;
  errorMessage: string;
  totalAttempts: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
}

export async function moveToDeadLetter(
  db: D1Database,
  entry: DeadLetterEntry,
): Promise<string> {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO dead_letter_queue (id, event_id, agent_id, delivery_id, tenant_id, event_type, event_source, event_payload, error_message, total_attempts, first_attempt_at, last_attempt_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      entry.eventId,
      entry.agentId,
      entry.deliveryId,
      entry.tenantId,
      entry.eventType,
      entry.eventSource,
      entry.eventPayload ?? null,
      entry.errorMessage,
      entry.totalAttempts,
      entry.firstAttemptAt,
      entry.lastAttemptAt,
    )
    .run();

  // Update delivery status to dead_letter
  await db
    .prepare("UPDATE event_deliveries SET status = 'dead_letter' WHERE id = ?")
    .bind(entry.deliveryId)
    .run();

  return id;
}

export async function replayDeadLetter(
  db: D1Database,
  dlqId: string,
  orchestratorUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const entry = await db
    .prepare("SELECT * FROM dead_letter_queue WHERE id = ?")
    .bind(dlqId)
    .first();

  if (!entry) {
    return { success: false, error: "Dead letter entry not found" };
  }

  if (entry.replayed_at) {
    return { success: false, error: "Already replayed" };
  }

  // Re-publish the event
  try {
    const response = await fetch(`${orchestratorUrl}/api/v1/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: entry.tenant_id,
        type: entry.event_type,
        source: entry.event_source,
        payload: entry.event_payload
          ? JSON.parse(entry.event_payload as string)
          : null,
        idempotencyKey: `replay-${dlqId}-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      await db
        .prepare(
          "UPDATE dead_letter_queue SET replayed_at = datetime('now'), replay_status = 'failed' WHERE id = ?",
        )
        .bind(dlqId)
        .run();
      return { success: false, error };
    }

    await db
      .prepare(
        "UPDATE dead_letter_queue SET replayed_at = datetime('now'), replay_status = 'success' WHERE id = ?",
      )
      .bind(dlqId)
      .run();

    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    await db
      .prepare(
        "UPDATE dead_letter_queue SET replayed_at = datetime('now'), replay_status = 'failed' WHERE id = ?",
      )
      .bind(dlqId)
      .run();
    return { success: false, error };
  }
}
