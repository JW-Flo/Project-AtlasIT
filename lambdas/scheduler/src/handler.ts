import type { EventBridgeEvent } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";

export async function handler(
  event: EventBridgeEvent<string, unknown>,
): Promise<void> {
  console.log("Scheduler invoked", { detailType: event["detail-type"] });

  const svc = bootstrap();

  // Fan out pending scheduled tasks via SQS
  // Currently supports: workflow recheck, compliance scan triggers
  const detailType = event["detail-type"];

  if (detailType === "ScheduledCheck" || detailType === "Scheduled Event") {
    // Publish a check task to the workflow queue for each active tenant
    // In MVP, we trigger a compliance snapshot refresh
    try {
      await svc.queueBus.publish("compliance", {
        type: "scheduled-scan",
        triggeredAt: new Date().toISOString(),
        source: "scheduler",
      });
    } catch (err) {
      console.error("Failed to publish scheduled task", { error: err });
    }
  }

  await svc.auditRepo.append({
    id: crypto.randomUUID(),
    tenantId: "system",
    action: "scheduler.invoked",
    actor: "system",
    resource: `eventbridge:${detailType}`,
    timestamp: new Date().toISOString(),
    metadata: { detail: event.detail },
  });
}
