export interface KVState<T = unknown> {
  get(key: string): Promise<T | null>;
  put(key: string, val: T, opts?: { ifMatch?: number }): Promise<number>; // returns new version
  scan(prefix: string, limit?: number): AsyncIterable<{ key: string; version: number }>;
}
