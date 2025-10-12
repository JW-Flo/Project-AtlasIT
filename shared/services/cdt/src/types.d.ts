// Minimal Cloudflare worker ambient declarations used in this package
interface R2Bucket {
  put(key: string, value: string | ArrayBuffer | Blob | ArrayBufferView): Promise<any>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  head(key: string): Promise<{ size: number } | null>;
}
interface KVNamespace {
  get(key: string, opts?: any): Promise<any>;
  put(key: string, value: string, opts?: any): Promise<void>;
  list(opts: { prefix: string; cursor?: string; limit?: number }): Promise<{ keys: { name: string }[]; cursor: string }>;
}
interface Queue<T=unknown> {
  send(message: T): Promise<void>;
}
interface ExportedHandler {
  fetch(request: Request, env: any, ctx: any): Promise<Response>;
}
