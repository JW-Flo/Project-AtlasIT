import type { RequestHandler } from "@sveltejs/kit";
import { requireSlackSignature } from "$lib/server/slack-verify";
import { handleSlackEvent } from "$lib/server/slack/event-handlers";

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform?.env as Record<string, unknown> | undefined;
  if (!env) {
    return new Response(JSON.stringify({ error: "no_env" }), { status: 500 });
  }

  const result = await requireSlackSignature(request, env);
  if (result instanceof Response) return result;

  const payload = JSON.parse(result.body);

  // URL verification challenge (required for Slack to verify this endpoint)
  if (payload.type === "url_verification") {
    return new Response(JSON.stringify({ challenge: payload.challenge }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Event callback
  if (payload.type === "event_callback") {
    const event = payload.event;
    const teamId = payload.team_id ?? "";
    const botToken = (env.SLACK_BOT_TOKEN as string) ?? null;

    console.log(
      JSON.stringify({
        level: "info",
        event: "slack.event_received",
        type: event?.type,
        team: teamId,
      }),
    );

    // Fire-and-forget: handle asynchronously so we respond within 3s
    if (event) {
      handleSlackEvent(event, botToken, teamId).catch((err) => {
        console.error(
          JSON.stringify({
            level: "error",
            event: "slack.event_handler_error",
            type: event?.type,
            error: err instanceof Error ? err.message : "Unknown error",
          }),
        );
      });
    }
  }

  // Slack expects 200 within 3 seconds; heavy work handled async above
  return new Response(null, { status: 200 });
};
