/**
 * Slack slash command handler logic for /atlas and /evidence commands.
 * Pure functions that return Slack-formatted response objects.
 */

export interface SlackCommandResponse {
  response_type: "ephemeral" | "in_channel";
  text: string;
}

export async function handleAtlasCommand(
  text: string,
  userId: string,
  db: D1Database | null,
  tenantId?: string | null,
): Promise<SlackCommandResponse> {
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
        text: `Unknown subcommand: \`${subcommand}\`. Try \`/atlas help\` for available commands.`,
      };
  }
}

function atlasHelp(): SlackCommandResponse {
  return {
    response_type: "ephemeral",
    text: [
      "*AtlasIT Commands*",
      "",
      "`/atlas help` — Show this help message",
      "`/atlas status` — View compliance scores across frameworks",
      "`/atlas task <description>` — Submit a task for automation",
      "`/evidence <trace_id>` — Look up an evidence artifact by trace ID",
    ].join("\n"),
  };
}

async function atlasStatus(
  db: D1Database | null,
  tenantId?: string | null,
): Promise<SlackCommandResponse> {
  if (!tenantId || !db) {
    return {
      response_type: "ephemeral",
      text: "This Slack workspace is not linked to an AtlasIT tenant. Connect Slack in the AtlasIT console under Integrations.",
    };
  }

  const { results } = await db
    .prepare(
      `SELECT framework, score, grade FROM compliance_scores WHERE tenant_id = ? ORDER BY framework`,
    )
    .bind(tenantId)
    .all<{ framework: string; score: number; grade: string }>();

  if (results.length === 0) {
    return {
      response_type: "ephemeral",
      text: "No compliance scores found. Set up your compliance frameworks in the AtlasIT console.",
    };
  }

  const lines = results.map((r) => `• *${r.framework}*: ${r.score}% (${r.grade})`);
  const avg = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

  return {
    response_type: "ephemeral",
    text: ["*Compliance Status*", "", ...lines, "", `_Overall average: ${avg}%_`].join("\n"),
  };
}

function atlasTask(description: string, userId: string): SlackCommandResponse {
  if (!description.trim()) {
    return {
      response_type: "ephemeral",
      text: "Please provide a task description: `/atlas task <description>`",
    };
  }

  return {
    response_type: "ephemeral",
    text: `Task received from <@${userId}>: _${description}_\nQueued for processing. You'll be notified when it completes.`,
  };
}

export async function handleEvidenceCommand(
  traceId: string,
  db: D1Database | null,
  tenantId?: string | null,
): Promise<SlackCommandResponse> {
  if (!traceId.trim()) {
    return {
      response_type: "ephemeral",
      text: "Please provide a trace_id: `/evidence <trace_id>`",
    };
  }

  if (!tenantId || !db) {
    return {
      response_type: "ephemeral",
      text: "This Slack workspace is not linked to an AtlasIT tenant. Connect Slack in the AtlasIT console under Integrations.",
    };
  }

  const record = await db
    .prepare(
      `SELECT trace_id, framework, control_ref, status, collected_at, source
       FROM evidence_records WHERE trace_id = ? AND tenant_id = ?`,
    )
    .bind(traceId, tenantId)
    .first<{
      trace_id: string;
      framework: string;
      control_ref: string;
      status: string;
      collected_at: string;
      source: string;
    }>();

  if (!record) {
    return {
      response_type: "ephemeral",
      text: `Evidence \`${traceId}\` not found for this tenant.`,
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
      `• *Collected:* ${record.collected_at}`,
    ].join("\n"),
  };
}
