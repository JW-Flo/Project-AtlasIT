import type { SQSEvent, SQSBatchResponse } from "aws-lambda";
import { processDlqBatch } from "./processor.js";

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  try {
    return await processDlqBatch(event);
  } catch (err) {
    console.error("[dlq-processor] Unhandled batch error", {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    // Return all message IDs as failures so they stay in the DLQ
    return {
      batchItemFailures: event.Records.map((r) => ({
        itemIdentifier: r.messageId,
      })),
    };
  }
}
