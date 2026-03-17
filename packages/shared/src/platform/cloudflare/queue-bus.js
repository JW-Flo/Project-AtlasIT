/**
 * Cloudflare Queue adapter for QueueBus interface.
 *
 * This module is the ONLY place that references Cloudflare Queue types.
 * Business logic imports QueueBus from the platform interfaces and never
 * touches CF-specific APIs directly.
 */
export class CloudflareQueueBus {
  queues;
  constructor(queues) {
    this.queues = queues;
  }
  async publish(queue, msg, opts) {
    const producer = this.queues[queue];
    if (!producer) {
      throw new Error(`Queue not bound: ${queue}`);
    }
    await producer.send(msg, {
      delaySeconds: opts?.delaySec,
    });
  }
}
