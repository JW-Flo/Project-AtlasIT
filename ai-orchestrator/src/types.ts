export type Bindings = {
  DB: D1Database;
  /** Shared DB where automation_rules and automation_executions live (same DB as console-app) */
  ATLAS_SHARED_DB: D1Database;
  TASKS: KVNamespace;
  AI_QUOTA: KVNamespace;
  IDEMPOTENCY_CACHE: KVNamespace;
  WORKFLOW: DurableObjectNamespace;
  /** Cloudflare Workflows binding — replaces WorkflowDO for new runs */
  ATLAS_WORKFLOW: Workflow;
  AUTOMATION: DurableObjectNamespace;
  STEP_TASKS: Queue;
  EVIDENCE: R2Bucket;
  API_ALLOWED_KEYS?: string;
  ENVIRONMENT?: string;
  /** JSON map of sourceId → HMAC secret for inbound event signature verification */
  EVENT_SOURCE_SECRETS: string;
  /** When "true", reject events without a valid X-Signature header */
  REQUIRE_EVENT_SIGNATURES?: string;
  /** Groq API key for AI features (NL automation builder, policy suggestions) */
  GROQ_API_KEY?: string;
  /** AWS credentials for Bedrock AI */
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  /** Primary AI provider (default: bedrock) */
  AI_PROVIDER?: string;
  /** Comma-separated fallback AI provider chain */
  AI_FALLBACKS?: string;
  /** Model override for daily digest (default: anthropic.claude-3-haiku-20240307-v1:0) */
  DIGEST_MODEL?: string;
  /** Model override for copilot (default: anthropic.claude-3-5-sonnet-20241022-v2:0) */
  COPILOT_MODEL?: string;
  /** JSON map of appId → adapter worker base URL for action dispatch */
  ADAPTER_URLS?: string;
  /** Base URL of this worker, used for self-referential event bus calls */
  SELF_URL?: string;
  /** Base URL of the compliance-worker for score recalculation */
  COMPLIANCE_WORKER_URL?: string;
  /** API key for internal service-to-service auth (shared across workers) */
  INTERNAL_API_KEY?: string;
};

export type Variables = {
  correlationId: string;
  tenantId: string;
  auth: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    tokenType: "jwt" | "api-key";
  };
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

export interface EventPayload {
  tenantId: string;
  type: string;
  source: string;
  payload?: unknown;
  idempotencyKey?: string;
}

export interface AgentSubscription {
  agentId: string;
  agentName: string;
  webhookUrl: string;
  secret: string;
  eventTypes: string[];
  status: "active" | "inactive";
}

export interface EventDelivery {
  id: string;
  eventId: string;
  agentId: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  nextRetryAt?: string;
}
