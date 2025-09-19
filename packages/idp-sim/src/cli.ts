#!/usr/bin/env node
import { clearRegistry, registerAdapter, getAdapter } from "@atlasit/idp";
import oktaAdapter, { USERS as OKTA_USERS } from "@atlasit/idp-okta";
import { writeArtifact } from "../../../src/lib/artifacts.js";

export async function runSimulation() {
  clearRegistry();
  registerAdapter(oktaAdapter.id, oktaAdapter, {
    flagEnvVar: oktaAdapter.featureFlag,
  });

  const env: Record<string, string> = { FEATURE_IDP_OKTA: "1" };
  const adapter = getAdapter(oktaAdapter.id, { env, requireEnabled: true });
  if (!adapter) {
    throw new Error("Okta adapter is not enabled");
  }

  const user = { ...OKTA_USERS[0], id: `${OKTA_USERS[0].id}-sim` };
  const result = await adapter.provisionUser({ user });

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
    adapter: adapter.displayName,
    subject: user.email,
    ok: result.ok,
    message: result.message,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSimulation().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
