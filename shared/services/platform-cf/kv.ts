import { KVState } from "../shared/iface-state";

export function makeKVState<T = unknown>(ns: KVNamespace): KVState<T> {
  return {
    async get(key: string) {
      const v = (await ns.get(key, { type: "json" })) as T | null;
      return v;
    },
    async put(key: string, val: T, opts?: { ifMatch?: number }) {
      // store version alongside value
      const meta = await ns.get(key + ":v");
      const current = meta ? parseInt(meta) : 0;
      if (opts?.ifMatch != null && opts.ifMatch !== current) {
        throw new Error("version_conflict");
      }
      const next = current + 1;
      await ns.put(key, JSON.stringify(val));
      await ns.put(key + ":v", String(next));
      return next;
    },
    async *scan(prefix: string, limit = 100) {
      let cursor: string | undefined = undefined;
      do {
        const listing = (await (ns as any).list({ prefix, cursor, limit })) as {
          keys: Array<{ name: string }>;
          cursor?: string;
        };
        for (const k of listing.keys) {
          if (k.name.endsWith(":v")) continue;
          const v = await ns.get(k.name + ":v");
          yield { key: k.name, version: v ? parseInt(v) : 0 };
        }
        cursor = listing.cursor;
      } while (cursor);
    },
  };
}
