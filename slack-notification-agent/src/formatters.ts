import type { SlackMessage, SlackBlock } from "./slack-client";

interface EventPayload {
  eventId: string;
  tenantId: string;
  type: string;
  source: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export function formatEventMessage(event: EventPayload): SlackMessage {
  const formatter = formatters[event.type] ?? formatDefault;
  return formatter(event);
}

function formatWorkflowStepCompleted(event: EventPayload): SlackMessage {
  const p = (event.payload ?? {}) as Record<string, unknown>;
  const workflowName = (p.workflowName as string) ?? "Unknown workflow";
  const stepName = (p.stepName as string) ?? "Unknown step";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Workflow Step Completed",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Workflow:*\n${workflowName}` },
        { type: "mrkdwn", text: `*Step:*\n${stepName}` },
        { type: "mrkdwn", text: `*Tenant:*\n${event.tenantId}` },
        { type: "mrkdwn", text: `*Source:*\n${event.source}` },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Event ID: ${event.eventId} | ${event.timestamp}`,
        },
      ],
    },
  ];

  return {
    text: `Step "${stepName}" completed in workflow "${workflowName}"`,
    blocks,
  };
}

function formatWorkflowStepFailed(event: EventPayload): SlackMessage {
  const p = (event.payload ?? {}) as Record<string, unknown>;
  const workflowName = (p.workflowName as string) ?? "Unknown workflow";
  const stepName = (p.stepName as string) ?? "Unknown step";
  const error = (p.error as string) ?? "No error details";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Workflow Step Failed", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Workflow:*\n${workflowName}` },
        { type: "mrkdwn", text: `*Step:*\n${stepName}` },
        { type: "mrkdwn", text: `*Tenant:*\n${event.tenantId}` },
        { type: "mrkdwn", text: `*Error:*\n${error}` },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Event ID: ${event.eventId} | ${event.timestamp}`,
        },
      ],
    },
  ];

  return {
    text: `Step "${stepName}" failed in workflow "${workflowName}": ${error}`,
    blocks,
  };
}

function formatIncidentCreated(event: EventPayload): SlackMessage {
  const p = (event.payload ?? {}) as Record<string, unknown>;
  const title = (p.title as string) ?? "Untitled incident";
  const severity = (p.severity as string) ?? "unknown";
  const description = (p.description as string) ?? "";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "New Incident Created", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Title:*\n${title}` },
        { type: "mrkdwn", text: `*Severity:*\n${severity}` },
        { type: "mrkdwn", text: `*Tenant:*\n${event.tenantId}` },
        { type: "mrkdwn", text: `*Source:*\n${event.source}` },
      ],
    },
  ];

  if (description) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Description:*\n${description}` },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Event ID: ${event.eventId} | ${event.timestamp}`,
      },
    ],
  });

  return { text: `Incident: ${title} (${severity})`, blocks };
}

function formatApprovalRequired(event: EventPayload): SlackMessage {
  const p = (event.payload ?? {}) as Record<string, unknown>;
  const requestType = (p.requestType as string) ?? "Unknown request";
  const requester = (p.requester as string) ?? "Unknown";
  const details = (p.details as string) ?? "";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Approval Required", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Request Type:*\n${requestType}` },
        { type: "mrkdwn", text: `*Requester:*\n${requester}` },
        { type: "mrkdwn", text: `*Tenant:*\n${event.tenantId}` },
        { type: "mrkdwn", text: `*Source:*\n${event.source}` },
      ],
    },
  ];

  if (details) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Details:*\n${details}` },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Event ID: ${event.eventId} | ${event.timestamp}`,
      },
    ],
  });

  return {
    text: `Approval required: ${requestType} from ${requester}`,
    blocks,
  };
}

function formatDefault(event: EventPayload): SlackMessage {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `Event: ${event.type}`, emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Type:*\n${event.type}` },
        { type: "mrkdwn", text: `*Source:*\n${event.source}` },
        { type: "mrkdwn", text: `*Tenant:*\n${event.tenantId}` },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Event ID: ${event.eventId} | ${event.timestamp}`,
        },
      ],
    },
  ];

  return { text: `Event received: ${event.type} from ${event.source}`, blocks };
}

const formatters: Record<string, (event: EventPayload) => SlackMessage> = {
  "workflow.step.completed": formatWorkflowStepCompleted,
  "workflow.step.failed": formatWorkflowStepFailed,
  "incident.created": formatIncidentCreated,
  "approval.required": formatApprovalRequired,
};
