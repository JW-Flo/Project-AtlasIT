import { BlobStore } from "../shared/iface-blob";

export function makeR2BlobStore(binding: R2Bucket): BlobStore {
  return {
    async put(key, body) {
      await binding.put(key, body);
    },
    async get(key) {
      const obj = await binding.get(key);
      return obj ? await obj.arrayBuffer() : null;
    },
    async head(key) {
      const obj = await binding.head(key);
      if (!obj) return null;
      return { size: obj.size };
    }
  };
}
