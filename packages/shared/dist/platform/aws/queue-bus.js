import { SendMessageCommand } from "@aws-sdk/client-sqs";
export class SQSQueueBus {
  client;
  queueUrls;
  constructor(client, queueUrls) {
    this.client = client;
    this.queueUrls = queueUrls;
  }
  async publish(queue, msg, opts) {
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
//# sourceMappingURL=queue-bus.js.map
