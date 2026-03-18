export type Bindings = {
  DB: D1Database;
  /** Shared DB where automation_rules and automation_executions live (same DB as console-app) */
  ATLAS_SHARED_DB: D1Database;
  TASKS: KVNamespace;
  AI_QUOTA: KVNamespace;
  IDEMPOTENCY_CACHE: KVNamespace;
  WORKFLOW: DurableObjectNamespace;
  AUTOMATION: DurableObjectNamespace;
  STEP_TASKS: Queue;
  EVIDENCE: R2Bucket;
  API_ALLOWED_KEYS?: string;
  ENVIRONMENT?: string;
  /** JSON map of sourceId → HMAC secret for inbound event signature verification */
  EVENT_SOURCE_SECRETS: string;
  /** When "true", reject events without a valid X-Signature header */
  REQUIRE_EVENT_SIGNATURES?: string;
  /** JSON map of appId → adapter worker base URL for action dispatch */
  ADAPTER_URLS?: string;
  /** Base URL of this worker, used for self-referential event bus calls */
  SELF_URL?: string;
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
