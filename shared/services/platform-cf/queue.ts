import { Queue } from "../shared/iface-queue";

export function makeQueue(binding: Queue<any>): Queue {
  return { async send(message: unknown) { await binding.send(message); } };
}
