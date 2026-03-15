export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
}

interface IncomingEvent {
  eventId: string;
  tenantId: string;
  type: string;
  source: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

const EVENT_ICONS: Record<string, string> = {
  "user.created": ":bust_in_silhouette:",
  "user.updated": ":pencil2:",
  "user.deleted": ":x:",
  "compliance.evidence.received": ":shield:",
  "compliance.scan.completed": ":mag:",
  "onboarding.completed": ":rocket:",
  "onboarding.failed": ":warning:",
  "integration.installed": ":electric_plug:",
  "integration.error": ":rotating_light:",
  "workflow.completed": ":white_check_mark:",
  "workflow.failed": ":red_circle:",
};

export function formatEventMessage(event: IncomingEvent): SlackMessage {
  const icon = EVENT_ICONS[event.type] ?? ":bell:";
  const title = `${icon} ${event.type}`;
  const payloadSummary = event.payload
    ? Object.entries(event.payload)
        .slice(0, 5)
        .map(
          ([k, v]) =>
            `*${k}:* ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
        )
        .join("\n")
    : "_No payload_";

  return {
    text: `${title} from ${event.source}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: title, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Source:*\n${event.source}` },
          {
            type: "mrkdwn",
            text: `*Tenant:*\n${event.tenantId.slice(0, 8)}...`,
          },
          {
            type: "mrkdwn",
            text: `*Event ID:*\n${event.eventId.slice(0, 8)}...`,
          },
          { type: "mrkdwn", text: `*Time:*\n${event.timestamp}` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Payload:*\n${payloadSummary}` },
      },
    ],
  };
}

export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackMessage,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Slack webhook failed (${response.status}): ${error}`);
  }
}
