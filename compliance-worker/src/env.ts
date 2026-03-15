export interface Env {
  D1_COMPLIANCE?: D1Database;
  atlasit_compliance?: D1Database;
  EVIDENCE_BUCKET?: R2Bucket;
  atlasit_evidence?: R2Bucket;
  BUILD_VERSION?: string;
  API_TOKENS?: KVNamespace;
  api_tokens?: KVNamespace;
  apiTokens?: KVNamespace;
  MAX_EVIDENCE_BYTES?: string | number;
  GROQ_API_KEY?: string;
  WEBHOOK_SECRET?: string;
  ORCHESTRATOR_URL?: string;
}

export function resolveD1(env: Env): D1Database | undefined {
  return env.D1_COMPLIANCE || env.atlasit_compliance;
}

export function resolveR2(env: Env): R2Bucket | undefined {
  return env.EVIDENCE_BUCKET || env.atlasit_evidence;
}
