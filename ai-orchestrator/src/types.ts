export type Bindings = {
  DB: D1Database;
  TASKS: KVNamespace;
  AI_QUOTA: KVNamespace;
  IDEMPOTENCY_CACHE: KVNamespace;
  WORKFLOW: DurableObjectNamespace;
  ENVIRONMENT?: string;
};

export type Variables = {
  correlationId: string;
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
