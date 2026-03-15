import { SQSClient } from "@aws-sdk/client-sqs";
import type { QueueBus, PublishOptions } from "../interfaces.js";
export declare class SQSQueueBus implements QueueBus {
  private readonly client;
  private readonly queueUrls;
  constructor(client: SQSClient, queueUrls: Record<string, string>);
  publish(queue: string, msg: unknown, opts?: PublishOptions): Promise<void>;
}
//# sourceMappingURL=queue-bus.d.ts.map
