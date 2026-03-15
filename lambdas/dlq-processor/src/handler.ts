import type { SQSEvent } from "aws-lambda";

export async function handler(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    console.error("DLQ message received", {
      messageId: record.messageId,
      queue: record.eventSourceARN,
      body,
      approximateReceiveCount: record.attributes.ApproximateReceiveCount,
    });

    // TODO: Write to DynamoDB for investigation dashboard
    // TODO: Send alert notification
  }
}
