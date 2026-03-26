import { Hono } from "hono";
import { sendSlackMessage, formatEventMessage } from "./slack";
import { verifySignature } from "./hmac";

type Bindings = {
  SLACK_WEBHOOK_URL: string;
  AGENT_SECRET: string;
  AGENT_NAME: string;
  ORCHESTRATOR_URL: string;
};

type Variables = {
  correlationId: string;
};

interface IncomingEvent {
  eventId: string;
  tenantId: string;
  type: string;
  source: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Health endpoint
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    service: "slack-notifier",
    agent: c.env.AGENT_NAME,
  });
});

// Webhook endpoint — receives events from orchestrator
app.post("/webhook", async (c) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  const signature = c.req.header("X-Signature");
  const eventId = c.req.header("X-Event-ID") ?? "unknown";

  if (!signature) {
    return c.json({ error: "Missing signature" }, 401);
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(rawBody, signature, c.env.AGENT_SECRET);
  if (!valid) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const event: IncomingEvent = JSON.parse(rawBody);

  // Format and send Slack message
  const message = formatEventMessage(event);

  try {
    await sendSlackMessage(c.env.SLACK_WEBHOOK_URL, message);

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        eventId,
        message: "Slack notification sent",
        eventType: event.type,
        tenantId: event.tenantId,
      }),
    );

    return c.json({ status: "processed", eventId });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        eventId,
        message: "Slack notification failed",
        error: errorMessage,
      }),
    );
    return c.json({ error: errorMessage }, 500);
  }
});

export default app;
