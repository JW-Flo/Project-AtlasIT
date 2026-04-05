import { env } from "cloudflare:test";

export interface TestBindings {
  DB: D1Database;
  KV_SESSIONS: KVNamespace;
  KV_CACHE: KVNamespace;
  KV_FEATURE_FLAGS: KVNamespace;
  MCP_STORE: KVNamespace;
}

export function getTestEnv(): TestBindings {
  return env as unknown as TestBindings;
}
