import type { SQSEvent } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";

export async function handler(event: SQSEvent): Promise<void> {
  const svc = bootstrap();

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const tenantId = body.tenantId ?? "system";

    console.error("DLQ message received", {
      messageId: record.messageId,
      queue: record.eventSourceARN,
      body,
      approximateReceiveCount: record.attributes.ApproximateReceiveCount,
    });

    await svc.auditRepo.append({
      id: record.messageId,
      tenantId,
      action: "dlq.received",
      actor: "system",
      resource: record.eventSourceARN ?? "unknown-queue",
      timestamp: new Date().toISOString(),
      metadata: {
        body,
        receiveCount: record.attributes.ApproximateReceiveCount,
        sentTimestamp: record.attributes.SentTimestamp,
      },
    });
  }
}
