import type { RequestHandler } from "@sveltejs/kit";
import { requireSlackSignature } from "$lib/server/slack-verify";

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform?.env as Record<string, unknown> | undefined;
  if (!env) {
    return new Response(JSON.stringify({ error: "no_env" }), { status: 500 });
  }

  const result = await requireSlackSignature(request, env);
  if (result instanceof Response) return result;

  // Slack sends interactions as form-encoded with a `payload` field
  const params = new URLSearchParams(result.body);
  const raw = params.get("payload");
  if (!raw) {
    return new Response(JSON.stringify({ error: "missing_payload" }), {
      status: 400,
    });
  }

  const payload = JSON.parse(raw);
  const type = payload.type; // block_actions, view_submission, shortcut, etc.

  console.log(
    JSON.stringify({
      level: "info",
      event: "slack.interaction_received",
      type,
      team: payload.team?.id,
      user: payload.user?.id,
    }),
  );

  // --- Block actions (button clicks, select menus) ---
  if (type === "block_actions") {
    const action = payload.actions?.[0];
    // TODO: route by action_id (e.g. approve_request, deny_request)
    console.log(
      JSON.stringify({
        level: "info",
        event: "slack.block_action",
        action_id: action?.action_id,
        value: action?.value,
      }),
    );
  }

  // --- View submissions (modal forms) ---
  if (type === "view_submission") {
    // TODO: handle modal form submissions
  }

  // Slack expects 200 within 3 seconds
  return new Response(null, { status: 200 });
};
