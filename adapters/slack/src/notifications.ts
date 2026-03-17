import { sendMessage, sendDirectMessage } from "./client.js";
import type {
  SlackBlock,
  SlackMessage,
  IncidentAlert,
  ApprovalRequest,
} from "./types.js";

// ---------------------------------------------------------------------------
// Generic notification
// ---------------------------------------------------------------------------

export async function sendNotification(
  token: string,
  channel: string,
  text: string,
  blocks?: SlackBlock[],
): Promise<SlackMessage> {
  return sendMessage(token, channel, text, blocks);
}

// ---------------------------------------------------------------------------
// Incident alert — structured card with severity color coding
// ---------------------------------------------------------------------------

const SEVERITY_EMOJI: Record<string, string> = {
  critical: ":rotating_light:",
  high: ":warning:",
  medium: ":large_yellow_circle:",
  low: ":information_source:",
};

function buildIncidentBlocks(incident: IncidentAlert): SlackBlock[] {
  const emoji = SEVERITY_EMOJI[incident.severity] ?? ":bell:";
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Incident: ${incident.title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Severity:*\n${incident.severity.toUpperCase()}`,
        },
        {
          type: "mrkdwn",
          text: `*Source:*\n${incident.source}`,
        },
        {
          type: "mrkdwn",
          text: `*Incident ID:*\n\`${incident.id}\``,
        },
        {
          type: "mrkdwn",
          text: `*Time:*\n${incident.timestamp}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Description:*\n${incident.description}`,
      },
    },
  ];

  if (incident.link) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Incident", emoji: true },
          url: incident.link,
          action_id: "view_incident",
        },
      ],
    });
  }

  blocks.push({ type: "divider" } as SlackBlock);

  return blocks;
}

export async function sendIncidentAlert(
  token: string,
  channel: string,
  incident: IncidentAlert,
): Promise<SlackMessage> {
  const blocks = buildIncidentBlocks(incident);
  const fallbackText = `[${incident.severity.toUpperCase()}] Incident: ${incident.title} - ${incident.description}`;

  return sendMessage(token, channel, fallbackText, blocks);
}

// ---------------------------------------------------------------------------
// Approval request — interactive message with approve/deny buttons
// ---------------------------------------------------------------------------

function buildApprovalBlocks(request: ApprovalRequest): SlackBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":clipboard: Approval Request",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Request:*\n${request.title}`,
        },
        {
          type: "mrkdwn",
          text: `*Requester:*\n${request.requester}`,
        },
        {
          type: "mrkdwn",
          text: `*Resource:*\n${request.resource}`,
        },
        {
          type: "mrkdwn",
          text: `*Urgency:*\n${request.urgency}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Details:*\n${request.description}`,
      },
    },
    {
      type: "actions",
      block_id: `approval_${request.id}`,
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Approve", emoji: true },
          style: "primary",
          action_id: "approval_approve",
          value: JSON.stringify({
            requestId: request.id,
            callbackUrl: request.callbackUrl,
          }),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Deny", emoji: true },
          style: "danger",
          action_id: "approval_deny",
          value: JSON.stringify({
            requestId: request.id,
            callbackUrl: request.callbackUrl,
          }),
        },
      ],
    },
    { type: "divider" } as SlackBlock,
  ];
}

export async function sendApprovalRequest(
  token: string,
  userId: string,
  request: ApprovalRequest,
): Promise<SlackMessage> {
  const blocks = buildApprovalBlocks(request);
  const fallbackText = `Approval requested: ${request.title} by ${request.requester}`;

  return sendDirectMessage(token, userId, fallbackText, blocks);
}
