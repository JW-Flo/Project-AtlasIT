import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import type { QueueBus, PublishOptions } from "../interfaces.js";

export class SQSQueueBus implements QueueBus {
  constructor(
    private readonly client: SQSClient,
    private readonly queueUrls: Record<string, string>,
  ) {}

  async publish(
    queue: string,
    msg: unknown,
    opts?: PublishOptions,
  ): Promise<void> {
    const queueUrl = this.queueUrls[queue];
    if (!queueUrl) throw new Error(`Unknown queue: ${queue}`);

    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(msg),
        DelaySeconds: opts?.delaySec,
      }),
    );
  }
}
