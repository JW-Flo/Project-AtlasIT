import { createAgentHandler } from "../../packages/mcp-sdk/src/handler";
import type { IncomingEvent } from "../../packages/mcp-sdk/src/types";
import { sendSlackMessage } from "./slack-client";
import { formatEventMessage } from "./formatters";

export interface Env {
  SLACK_WEBHOOK_URL: string;
  AGENT_SECRET: string;
}

export function buildApp(env: Env) {
  return createAgentHandler({
    secret: env.AGENT_SECRET,
    agentId: "slack-notification-agent",
    agentName: "Slack Notification Agent",
    handlers: {
      "workflow.step.completed": async (event: IncomingEvent) => {
        const message = formatEventMessage(event);
        await sendSlackMessage(env.SLACK_WEBHOOK_URL, message);
      },
      "workflow.step.failed": async (event: IncomingEvent) => {
        const message = formatEventMessage(event);
        await sendSlackMessage(env.SLACK_WEBHOOK_URL, message);
      },
      "incident.created": async (event: IncomingEvent) => {
        const message = formatEventMessage(event);
        await sendSlackMessage(env.SLACK_WEBHOOK_URL, message);
      },
      "approval.required": async (event: IncomingEvent) => {
        const message = formatEventMessage(event);
        await sendSlackMessage(env.SLACK_WEBHOOK_URL, message);
      },
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "slack-notification-agent",
          timestamp: new Date().toISOString(),
          configured: Boolean(env.SLACK_WEBHOOK_URL && env.AGENT_SECRET),
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    if (!env.SLACK_WEBHOOK_URL || !env.SLACK_WEBHOOK_URL.startsWith("http"))
      return new Response(JSON.stringify({ error: "SLACK_WEBHOOK_URL not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
    if (!env.AGENT_SECRET)
      return new Response(JSON.stringify({ error: "AGENT_SECRET not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
    const app = buildApp(env);
    return app.fetch(request, undefined, ctx);
  },
};
