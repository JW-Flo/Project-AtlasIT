export interface BlobStore {
  put(key: string, body: ArrayBuffer, opts?: { sha256?: string; immutable?: boolean }): Promise<void>;
  get(key: string): Promise<ArrayBuffer | null>;
  head?(key: string): Promise<{ sha256?: string; size?: number } | null>;
}
