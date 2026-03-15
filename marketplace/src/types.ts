export type Bindings = {
  DB: D1Database;
  KV_CACHE: KVNamespace;
  API_ALLOWED_KEYS?: string;
  ENVIRONMENT?: string;
};

export type Variables = { correlationId: string; tenantId: string };

export type AppEnv = { Bindings: Bindings; Variables: Variables };
