import { Queue } from "../../../shared/iface-queue";

export function makeRemediationRunner(q: Queue) {
  return {
    async enqueue(tenant: string, control_id: string, context: unknown) {
      await q.send({ tenant, control_id, context, ts: Date.now() });
    }
  };
}
