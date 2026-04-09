/**
 * SQS-backed queue repo — replaces Cloudflare Queues (atlasit-step-tasks).
 */

import type { SQSClient } from "@aws-sdk/client-sqs";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

export interface StepTask {
  tenantId: string;
  workflowRunId: string;
  stepIndex: number;
  action: string;
  payload: Record<string, unknown>;
}

export class SqsQueueRepo {
  constructor(
    private readonly sqs: SQSClient,
    private readonly queueUrl: string,
  ) {}

  async send(task: StepTask, delaySeconds = 0): Promise<string> {
    const result = await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(task),
        DelaySeconds: delaySeconds,
        MessageGroupId: task.tenantId,
        MessageAttributes: {
          tenantId: { DataType: "String", StringValue: task.tenantId },
          action: { DataType: "String", StringValue: task.action },
        },
      }),
    );
    return result.MessageId!;
  }
}
