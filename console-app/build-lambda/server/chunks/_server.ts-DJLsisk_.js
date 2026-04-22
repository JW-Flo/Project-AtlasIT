import { r as requireSlackSignature } from './slack-verify-DWbLguuy.js';
import { r as resolveSlackTenant } from './resolve-tenant-D40mFDr1.js';

async function handleAtlasCommand(text, userId, db, tenantId) {
  const parts = text.trim().split(/\s+/);
  const subcommand = parts[0]?.toLowerCase() || "help";
  switch (subcommand) {
    case "help":
    case "":
      return atlasHelp();
    case "status":
      return atlasStatus(db, tenantId);
    case "task":
      return atlasTask(parts.slice(1).join(" "), userId);
    default:
      return {
        response_type: "ephemeral",
        text: `Unknown subcommand: \`${subcommand}\`. Try \`/atlas help\` for available commands.`
      };
  }
}
function atlasHelp() {
  return {
    response_type: "ephemeral",
    text: [
      "*AtlasIT Commands*",
      "",
      "`/atlas help` — Show this help message",
      "`/atlas status` — View compliance scores across frameworks",
      "`/atlas task <description>` — Submit a task for automation",
      "`/evidence <trace_id>` — Look up an evidence artifact by trace ID"
    ].join("\n")
  };
}
async function atlasStatus(db, tenantId) {
  if (!tenantId || !db) {
    return {
      response_type: "ephemeral",
      text: "This Slack workspace is not linked to an AtlasIT tenant. Connect Slack in the AtlasIT console under Integrations."
    };
  }
  const { results } = await db.prepare(
    `SELECT framework, score, grade FROM compliance_scores WHERE tenant_id = ? ORDER BY framework`
  ).bind(tenantId).all();
  if (results.length === 0) {
    return {
      response_type: "ephemeral",
      text: "No compliance scores found. Set up your compliance frameworks in the AtlasIT console."
    };
  }
  const lines = results.map((r) => `• *${r.framework}*: ${r.score}% (${r.grade})`);
  const avg = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  return {
    response_type: "ephemeral",
    text: ["*Compliance Status*", "", ...lines, "", `_Overall average: ${avg}%_`].join("\n")
  };
}
function atlasTask(description, userId) {
  if (!description.trim()) {
    return {
      response_type: "ephemeral",
      text: "Please provide a task description: `/atlas task <description>`"
    };
  }
  return {
    response_type: "ephemeral",
    text: `Task received from <@${userId}>: _${description}_
Queued for processing. You'll be notified when it completes.`
  };
}
async function handleEvidenceCommand(traceId, db, tenantId) {
  if (!traceId.trim()) {
    return {
      response_type: "ephemeral",
      text: "Please provide a trace_id: `/evidence <trace_id>`"
    };
  }
  if (!tenantId || !db) {
    return {
      response_type: "ephemeral",
      text: "This Slack workspace is not linked to an AtlasIT tenant. Connect Slack in the AtlasIT console under Integrations."
    };
  }
  const record = await db.prepare(
    `SELECT trace_id, framework, control_ref, status, collected_at, source
       FROM evidence_records WHERE trace_id = ? AND tenant_id = ?`
  ).bind(traceId, tenantId).first();
  if (!record) {
    return {
      response_type: "ephemeral",
      text: `Evidence \`${traceId}\` not found for this tenant.`
    };
  }
  return {
    response_type: "ephemeral",
    text: [
      `*Evidence: \`${record.trace_id}\`*`,
      "",
      `• *Framework:* ${record.framework}`,
      `• *Control:* ${record.control_ref}`,
      `• *Status:* ${record.status}`,
      `• *Source:* ${record.source}`,
      `• *Collected:* ${record.collected_at}`
    ].join("\n")
  };
}
const POST = async ({ request, platform }) => {
  const env = platform?.env;
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
      user: userId
    })
  );
  const db = env.ATLAS_SHARED_DB ?? null;
  const tenantId = db && teamId ? await resolveSlackTenant(db, teamId) : null;
  if (command === "/atlas") {
    const response = await handleAtlasCommand(text, userId, db, tenantId);
    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" }
    });
  }
  if (command === "/evidence") {
    const response = await handleEvidenceCommand(text.trim(), db, tenantId);
    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" }
    });
  }
  return new Response(
    JSON.stringify({
      response_type: "ephemeral",
      text: `Unknown command: ${command}`
    }),
    { headers: { "content-type": "application/json" } }
  );
};

export { POST };
//# sourceMappingURL=_server.ts-DJLsisk_.js.map
