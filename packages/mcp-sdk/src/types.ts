export interface AgentConfig {
  name: string;
  description?: string;
  orchestratorUrl: string;
  webhookUrl: string;
  healthCheckUrl?: string;
  capabilities?: string[];
  eventTypes: string[];
}

export interface AgentRegistration {
  id: string;
  name: string;
  webhookUrl: string;
  secret: string;
  eventTypes: string[];
  status: string;
}

export interface IncomingEvent {
  eventId: string;
  tenantId: string;
  type: string;
  source: string;
  payload?: unknown;
  timestamp: string;
}

export type EventHandler = (
  event: IncomingEvent,
  context: EventContext,
) => Promise<void>;

export interface EventContext {
  correlationId: string;
  agentId: string;
  agentName: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  details?: Record<string, unknown>;
}
