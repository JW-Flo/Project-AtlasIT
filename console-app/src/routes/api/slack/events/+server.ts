import type { RequestHandler } from "@sveltejs/kit";
import { requireSlackSignature } from "$lib/server/slack-verify";

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform?.env as Record<string, unknown> | undefined;
  if (!env) {
    return new Response(JSON.stringify({ error: "no_env" }), { status: 500 });
  }

  const result = await requireSlackSignature(request, env);
  if (result instanceof Response) return result;

  const payload = JSON.parse(result.body);

  // --- URL verification challenge (required for Slack to verify this endpoint) ---
  if (payload.type === "url_verification") {
    return new Response(JSON.stringify({ challenge: payload.challenge }), {
      headers: { "content-type": "application/json" },
    });
  }

  // --- Event callback ---
  if (payload.type === "event_callback") {
    const event = payload.event;
    console.log(
      JSON.stringify({
        level: "info",
        event: "slack.event_received",
        type: event?.type,
        team: payload.team_id,
      }),
    );

    // TODO: dispatch events to appropriate handlers
    // e.g. app_mention, message.channels, reaction_added, etc.
  }

  // Slack expects 200 within 3 seconds; do heavy work async
  return new Response(null, { status: 200 });
};
