/**
 * Cloudflare Queue adapter for QueueBus interface.
 *
 * This module is the ONLY place that references Cloudflare Queue types.
 * Business logic imports QueueBus from the platform interfaces and never
 * touches CF-specific APIs directly.
 */
import type { QueueBus, PublishOptions } from "../interfaces.js";
/**
 * Minimal subset of the Cloudflare Queue producer interface.
 * We define this locally to avoid leaking @cloudflare/workers-types
 * into the interface boundary.
 */
interface CFQueueProducer {
  send(
    message: unknown,
    options?: {
      delaySeconds?: number;
    },
  ): Promise<void>;
}
export declare class CloudflareQueueBus implements QueueBus {
  private readonly queues;
  constructor(queues: Record<string, CFQueueProducer>);
  publish(queue: string, msg: unknown, opts?: PublishOptions): Promise<void>;
}
export {};
//# sourceMappingURL=queue-bus.d.ts.map
