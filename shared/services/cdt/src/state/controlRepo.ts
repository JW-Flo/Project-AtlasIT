import { KVState } from "../../../shared/iface-state";
import { ControlState } from "../models";

export function makeControlRepo(ns: KVState<ControlState>) {
  const key = (t: string, c: string) => `${t}/control/${c}`;
  return {
    async get(tenant: string, controlId: string) {
      return await ns.get(key(tenant, controlId));
    },
    async put(cs: ControlState) {
      const ver = await ns.put(key(cs.tenant, cs.control_id), cs, { ifMatch: cs.version });
      cs.version = ver;
      return cs;
    }
    async upsert(tenant: string, controlId: string, mut: (current: ControlState | undefined) => ControlState) {
      const k = key(tenant, controlId);
      for (let attempt = 0; attempt < 5; attempt++) {
        const cur = await ns.get(k) ?? undefined;
        const next = mut(cur);
        next.version = cur?.version ?? 0;
        try {
          const ver = await ns.put(k, next, { ifMatch: next.version });
          next.version = ver;
          return next;
        } catch (e: any) {
          if (String(e.message) === "version_conflict") continue; // retry
          throw e;
        }
      }
      throw new Error("write_conflict_exceeded");
    }
  };
}
