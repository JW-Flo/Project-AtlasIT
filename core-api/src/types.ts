export type Bindings = {
  DB: D1Database;
  KV_SESSIONS: KVNamespace;
  KV_CACHE: KVNamespace;
  KV_FEATURE_FLAGS: KVNamespace;
  JWT_ISSUER?: string;
  JWT_AUDIENCE?: string;
  API_ALLOWED_KEYS?: string;
  ENVIRONMENT?: string;
  CRED_ENCRYPTION_KEY: string;
};

export type Variables = {
  correlationId: string;
  auth: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    tokenType: "jwt" | "api-key";
  };
  tenantId: string;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
