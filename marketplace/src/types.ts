export type Bindings = {
  DB: D1Database;
  KV_CACHE: KVNamespace;
  ENVIRONMENT?: string;
};

export type Variables = { correlationId: string };

export type AppEnv = { Bindings: Bindings; Variables: Variables };
