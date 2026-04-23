import type { RequestHandler } from "@sveltejs/kit";
import { requireSlackSignature } from "$lib/server/slack-verify";
import { resolveSlackTenant } from "$lib/server/slack/resolve-tenant";
import { handleAtlasCommand, handleEvidenceCommand } from "$lib/server/slack/command-handlers";

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform?.env as Record<string, unknown> | undefined;
  if (!env) {
    return new Response(JSON.stringify({ error: "no_env" }), { status: 500 });
  }

  const result = await requireSlackSignature(request, env);
  if (result instanceof Response) return result;

  const params = new URLSearchParams(result.body);
  const command = params.get("command");
  const text = params.get("text") ?? "";
  const userId = params.get("user_id") ?? "";
  const teamId = params.get("team_id") ?? "";

  console.log(
    JSON.stringify({
      level: "info",
      event: "slack.command_received",
      command,
      text,
      team: teamId,
      user: userId,
    }),
  );

  const tenantId = teamId ? await resolveSlackTenant(teamId) : null;

  if (command === "/atlas") {
    const response = await handleAtlasCommand(text, userId, tenantId);
    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
    });
  }

  if (command === "/evidence") {
    const response = await handleEvidenceCommand(text.trim(), tenantId);
    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      response_type: "ephemeral",
      text: `Unknown command: ${command}`,
    }),
    { headers: { "content-type": "application/json" } },
  );
};
