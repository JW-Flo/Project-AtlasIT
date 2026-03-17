import type { RequestHandler } from "@sveltejs/kit";
import { requireSlackSignature } from "$lib/server/slack-verify";

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
  const userId = params.get("user_id");
  const teamId = params.get("team_id");
  const responseUrl = params.get("response_url");

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

  // --- /atlas command ---
  if (command === "/atlas") {
    // TODO: route subcommands (e.g. "help", "status", task dispatch)
    return new Response(
      JSON.stringify({
        response_type: "ephemeral",
        text: `AtlasIT received: \`/atlas ${text}\`\nThis command is being set up — stay tuned.`,
      }),
      { headers: { "content-type": "application/json" } },
    );
  }

  // --- /evidence command ---
  if (command === "/evidence") {
    // TODO: look up evidence by trace_id
    return new Response(
      JSON.stringify({
        response_type: "ephemeral",
        text: `Evidence lookup for: \`${text || "(no trace_id)"}\`\nThis command is being set up — stay tuned.`,
      }),
      { headers: { "content-type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      response_type: "ephemeral",
      text: `Unknown command: ${command}`,
    }),
    { headers: { "content-type": "application/json" } },
  );
};
