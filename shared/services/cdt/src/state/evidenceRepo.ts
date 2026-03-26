import { BlobStore } from "../../../shared/iface-blob";
import { Evidence } from "../models";

function ulid() {
  const t = Date.now();
  const rand = crypto.getRandomValues(new Uint8Array(10));
  return t.toString(36) + Array.from(rand).map(x=>x.toString(36).padStart(2,'0')).join('');
}

export function makeEvidenceRepo(bucket: BlobStore) {
  return {
    async writeEvidence(obj: unknown, meta: Omit<Evidence, "sha256"|"uri"|"id"|"timestamp">): Promise<Evidence> {
      const bytes = new TextEncoder().encode(JSON.stringify(obj));
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)))
        .map(b => b.toString(16).padStart(2, "0")).join("");
  const id = ulid();
  const day = new Date().toISOString().slice(0,10);
  const path = `evidence/${meta.tenant}/${meta.control_id}/${day}/${id}.json`;
  await bucket.put(path, bytes.buffer, { });
  const ev: Evidence = {
    id, control_id: meta.control_id, uri: `r2://${path}`, sha256: hash,
    producer: meta.producer, tenant: meta.tenant, trace_id: meta.trace_id,
    timestamp: new Date().toISOString(), meta: meta.meta
  };
  return ev;
    }
  };
}
