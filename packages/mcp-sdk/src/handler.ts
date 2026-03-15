import { Hono } from "hono";
import type {
  IncomingEvent,
  EventHandler,
  EventContext,
  HealthStatus,
} from "./types";
import { verifySignature } from "./hmac";

export interface AgentHandlerConfig {
  secret: string;
  agentId: string;
  agentName: string;
  handlers: Record<string, EventHandler>;
  healthCheck?: () => Promise<HealthStatus>;
}

export function createAgentHandler(config: AgentHandlerConfig): Hono {
  const app = new Hono();

  // Health endpoint
  app.get("/health", async (c) => {
    if (config.healthCheck) {
      const status = await config.healthCheck();
      return c.json(status);
    }
    return c.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Event webhook endpoint
  app.post("/webhook", async (c) => {
    const signature = c.req.header("X-Signature");
    const correlationId =
      c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
    const eventId = c.req.header("X-Event-ID") ?? "unknown";

    const rawBody = await c.req.text();

    // Verify HMAC signature
    if (!signature) {
      return c.json({ error: "Missing signature" }, 401);
    }

    const valid = await verifySignature(rawBody, signature, config.secret);
    if (!valid) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    const event: IncomingEvent = JSON.parse(rawBody);

    const context: EventContext = {
      correlationId,
      agentId: config.agentId,
      agentName: config.agentName,
    };

    // Find handler for event type
    const handler = config.handlers[event.type] ?? config.handlers["*"];
    if (!handler) {
      return c.json({ error: `No handler for event type: ${event.type}` }, 422);
    }

    try {
      await handler(event, context);
      return c.json({ status: "processed", eventId: event.eventId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          eventId,
          agentId: config.agentId,
          error: message,
        }),
      );
      return c.json({ error: message }, 500);
    }
  });

  return app;
}
