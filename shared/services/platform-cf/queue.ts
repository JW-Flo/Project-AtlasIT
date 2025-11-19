import { Queue } from "../shared/iface-queue";

// Adapt binding to Queue interface (no generics needed)
export function makeQueue(binding: Queue): Queue {
  return {
    async send(message: unknown) {
      await (binding as any).send(message);
    },
  };
}
