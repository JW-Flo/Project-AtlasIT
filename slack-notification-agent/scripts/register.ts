/**
 * Register the Slack Notification Agent with the AI Orchestrator.
 *
 * Usage:
 *   ORCHESTRATOR_URL=https://orchestrator.atlasit.pro npx tsx scripts/register.ts
 *
 * The orchestrator returns a secret that must be set as the AGENT_SECRET
 * worker secret via `wrangler secret put AGENT_SECRET`.
 */

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATOR_URL ?? "http://localhost:8787";

const WEBHOOK_URL =
  process.env.WEBHOOK_URL ??
  "https://atlasit-slack-notification-agent.atlasit.workers.dev/webhook";

async function main() {
  const body = {
    name: "slack-notification-agent",
    description:
      "Sends Slack notifications for workflow, incident, and approval events",
    webhookUrl: WEBHOOK_URL,
    healthCheckUrl: WEBHOOK_URL.replace("/webhook", "/health"),
    capabilities: ["slack-notification"],
    eventTypes: [
      "workflow.step.completed",
      "workflow.step.failed",
      "incident.created",
      "approval.required",
    ],
  };

  console.log(`Registering agent with orchestrator at ${ORCHESTRATOR_URL}...`);

  const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Registration failed:", JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log("Agent registered successfully.");
  console.log(`  Agent ID: ${result.data.id}`);
  console.log(`  Secret:   ${result.data.secret}`);
  console.log("");
  console.log(
    "Set the secret on your worker:\n  wrangler secret put AGENT_SECRET",
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
