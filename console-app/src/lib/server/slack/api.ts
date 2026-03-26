/**
 * Minimal Slack Web API helpers for outbound messages.
 * Used by event handlers to reply to mentions and DMs.
 */

interface SlackApiResponse {
  ok: boolean;
  error?: string;
}

export async function postMessage(
  token: string,
  channel: string,
  text: string,
): Promise<SlackApiResponse> {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text }),
  });

  return res.json() as Promise<SlackApiResponse>;
}
