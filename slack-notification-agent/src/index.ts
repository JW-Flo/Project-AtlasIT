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
    if (!env.SLACK_WEBHOOK_URL || !env.SLACK_WEBHOOK_URL.startsWith("http"))
      throw new Error("Missing or invalid required env: SLACK_WEBHOOK_URL");
    if (!env.AGENT_SECRET)
      throw new Error("Missing required env: AGENT_SECRET");
    const app = buildApp(env);
    return app.fetch(request, undefined, ctx);
  },
};
