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
  send(message: unknown, options?: { delaySeconds?: number }): Promise<void>;
}

export class CloudflareQueueBus implements QueueBus {
  private readonly queues: Record<string, CFQueueProducer>;

  constructor(queues: Record<string, CFQueueProducer>) {
    this.queues = queues;
  }

  async publish(
    queue: string,
    msg: unknown,
    opts?: PublishOptions,
  ): Promise<void> {
    const producer = this.queues[queue];
    if (!producer) {
      throw new Error(`Queue not bound: ${queue}`);
    }
    await producer.send(msg, {
      delaySeconds: opts?.delaySec,
    });
  }
}
