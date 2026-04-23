import type { RequestHandler } from "@sveltejs/kit";
import { requireSlackSignature } from "$lib/server/slack-verify";
import { resolveSlackTenant } from "$lib/server/slack/resolve-tenant";
import { handleBlockActions, handleViewSubmission } from "$lib/server/slack/interaction-handlers";

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
  const type = payload.type;

  console.log(
    JSON.stringify({
      level: "info",
      event: "slack.interaction_received",
      type,
      team: payload.team?.id,
      user: payload.user?.id,
    }),
  );

  const teamId = payload.team?.id;
  const tenantId = teamId ? await resolveSlackTenant(teamId) : null;

  if (type === "block_actions") {
    await handleBlockActions(payload, tenantId);
  }

  if (type === "view_submission") {
    await handleViewSubmission(payload);
  }

  // Slack expects 200 within 3 seconds
  return new Response(null, { status: 200 });
};
