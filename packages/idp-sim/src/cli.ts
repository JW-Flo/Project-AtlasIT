#!/usr/bin/env node
import { clearRegistry, registerAdapter } from "@atlasit/idp";
import {
  createOktaAdapter,
  OKTA_ADAPTER_ID,
  OKTA_FLAG_ENV,
  loadFixtureUsers,
} from "@atlasit/idp-adapters/okta";
import { writeArtifact } from "../../../src/lib/artifacts.js";

export async function runSimulation() {
  clearRegistry();
  const adapter = createOktaAdapter();
  registerAdapter(OKTA_ADAPTER_ID, adapter, { flagEnvVar: OKTA_FLAG_ENV });

  // enable adapter via env
  const env: Record<string, string> = { [OKTA_FLAG_ENV]: "1" };
  Object.assign(process.env, env);

  const users = loadFixtureUsers();
  const user = { ...users[0], id: `${users[0].id}-sim` };
  const result = await (adapter as any).provision({
    user,
    groups: user.groups ?? [],
  });

  const logLines = [
    `adapter: ${adapter.displayName}`,
    `subject: ${user.email}`,
    `result: ${result.ok ? "success" : "failure"}`,
    result.message ? `message: ${result.message}` : null,
  ].filter(Boolean) as string[];

  const junit = `<testsuite name="idp-sim" tests="1" failures="${result.ok ? 0 : 1}">
  <testcase name="okta-provision">
    ${result.ok ? "" : `<failure message="${result.message ?? "failed"}"/>`}
  </testcase>
</testsuite>\n`;

  await writeArtifact("idp", "sim.log", logLines.join("\n") + "\n");
  await writeArtifact("idp", "junit.xml", junit);
  await writeArtifact("idp", "RUN.json", {
    generatedAt: new Date().toISOString(),
    adapter: adapter.metadata?.name ?? "okta",
    subject: user.email,
    ok: true,
    message: "provisioned",
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSimulation().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
